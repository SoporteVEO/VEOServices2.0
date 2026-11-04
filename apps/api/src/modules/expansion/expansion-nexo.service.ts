import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { z } from 'zod';
import { AGENT_NAME } from '../agent/agent-brand.js';
import { getMissingAgentApiKey, loadAgentModel } from '../agent/agent-model.js';
import { assertWithinRateLimit } from '../agent/agent-rate-limit.js';
import { loadAgentSdk } from '../agent/agent-sdk.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ExpansionNexoInsightDto } from './dto/expansion.dto.js';
import type { LocationContext } from './expansion-location-context.js';
import { ExpansionLocationService } from './expansion-location.service.js';

const MAX_OUTPUT_TOKENS = 1500;
const MAX_COMMENTS = 8;

const FORMAT_LABELS: Record<string, string> = {
  VS: 'valla estándar',
  VE: 'valla espectacular',
  MV: 'mini valla',
  TR: 'torre',
  PT: 'portal',
  PS: 'pasarela',
  PLT: 'paleta',
  VD: 'valla digital',
};

const FACTOR_LABELS: Record<string, string> = {
  demand: 'Rentabilidad de vallas vecinas',
  occupancy: 'Ocupación esperada',
  competition: 'Competencia con vallas propias',
  exposure: 'Exposición vehicular',
  density: 'Densidad urbana',
  financial: 'Retorno financiero',
};

const insightSchema = z.object({
  verdict: z
    .enum(['RECOMMENDED', 'CAUTION', 'NOT_RECOMMENDED'])
    .describe('Your own recommendation after weighing every fact'),
  headline: z.string().describe('One sentence verdict, max 110 characters'),
  summary: z.string().describe('2-3 sentence assessment'),
  strengths: z.array(z.string()).describe('Up to 4 concrete strengths'),
  risks: z.array(z.string()).describe('Up to 4 concrete risks'),
  suggestions: z
    .array(z.string())
    .describe('Up to 3 actionable next steps or adjustments'),
});

export type ExpansionNexoInsight = z.infer<typeof insightSchema> & {
  generatedAt: string;
  usedSurroundings: boolean;
};

const INSTRUCTIONS = `You are ${AGENT_NAME}, the expansion analyst of VEO, an out-of-home advertising company in El Salvador (static billboards and digital screens). The expansion team proposes a location for a NEW billboard and you judge whether it is worth building.

How to judge a location (weigh them together, they are not independent):
- Traffic exposure drives value: billboards on highways, trunk and primary avenues sell; residential or local streets have few cars and few potential advertisers. A site on a local street should rarely be recommended unless a main road is within ~100 m with visibility.
- Urban density matters: dense commercial areas (many shops/services, many buildings) bring audiences and advertisers; low-density, rural or peripheral areas rank down, except along highways with heavy intercity traffic.
- Own saturation hurts: many VEO billboards nearby split the same audience and advertisers (cannibalization). A billboard closer than ~150 m to an existing one is a serious problem; 5+ within 1 km is a saturated zone.
- Demand evidence: occupancy and profitability of nearby VEO billboards show what the market pays for there. High occupancy in an underserved zone is an opportunity.
- Economics: compare the expected revenue (price × expected occupancy) with the monthly cost; mention the break-even occupancy when given.
- Format fit: spectacular formats need highways or wide avenues and distance visibility; mini vallas and paletas fit dense, slower urban streets.

Rules:
- Write in neutral, professional Spanish for the expansion manager. Be direct and specific; cite road names, distances, counts and amounts from the facts.
- Use only the facts given. Never invent traffic counts, population figures, prices or permits. When a fact is missing (e.g. surroundings unavailable) say what should be verified on site.
- Your verdict may differ from the system score if the facts justify it; explain why in the summary.
- Each list item is one short sentence. No markdown, no headings.`;

function money(value: number | null | undefined): string {
  return value == null
    ? 'sin dato'
    : `USD ${Math.round(value).toLocaleString('en-US')}`;
}

function percent(value: number | null | undefined): string {
  return value == null ? 'sin dato' : `${Math.round(value * 100)}%`;
}

function surroundingsFacts(context: LocationContext | null): string {
  if (!context) {
    return '- Entorno OpenStreetMap: no disponible (verificar tráfico y densidad en visita).';
  }
  const { locality, road } = context;
  const place = [
    locality.neighbourhood,
    locality.suburb,
    locality.city,
    locality.department,
  ]
    .filter(Boolean)
    .join(', ');
  const lines = [
    place ? `- Zona: ${place}` : null,
    `- Calle frente al sitio: ${road?.name ?? 'sin nombre'} (clase ${road?.roadClass ?? 'desconocida'})`,
    context.majorRoads.length
      ? `- Vías principales cercanas: ${context.majorRoads
          .map(
            (r) =>
              `${r.name ?? 'sin nombre'} (${r.roadClass}, ${r.distanceM} m)`,
          )
          .join('; ')}`
      : context.sources.overpass
        ? '- Vías principales cercanas: ninguna en 400 m'
        : '- Vías principales cercanas: dato no disponible',
    `- Asentamiento: ${context.settlement}`,
    context.poiCount500m != null
      ? `- Comercios/servicios/oficinas en 500 m: ${context.poiCount500m}`
      : null,
    context.buildingCount300m != null
      ? `- Edificaciones en 300 m: ${context.buildingCount300m}`
      : null,
    context.landuse.length
      ? `- Uso de suelo: ${context.landuse.join(', ')}`
      : null,
    `- Nivel de tráfico estimado: ${context.trafficLevel} (exposición ${Math.round(context.exposureScore * 100)}/100)`,
    `- Densidad estimada: ${context.densityLevel} (${Math.round(context.densityScore * 100)}/100)`,
  ];
  return lines.filter(Boolean).join('\n');
}

@Injectable()
export class ExpansionNexoService {
  private readonly logger = new Logger(ExpansionNexoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly location: ExpansionLocationService,
  ) {}

  async insight(
    userId: string,
    dto: ExpansionNexoInsightDto,
  ): Promise<ExpansionNexoInsight> {
    const missingKey = getMissingAgentApiKey();
    if (missingKey) {
      throw new ServiceUnavailableException(
        `${AGENT_NAME} no está configurado todavía (falta ${missingKey}).`,
      );
    }
    assertWithinRateLimit(userId);

    const [{ ai }, { model }, context, site] = await Promise.all([
      loadAgentSdk(),
      loadAgentModel(),
      this.location.tryGetContext(dto.latitude, dto.longitude),
      dto.siteId
        ? this.prisma.expansionSite.findUnique({
            where: { id: dto.siteId },
            select: {
              description: true,
              comments: {
                orderBy: { createdAt: 'desc' },
                take: MAX_COMMENTS,
                select: { body: true },
              },
            },
          })
        : null,
    ]);

    try {
      const result = await ai.generateText({
        model,
        instructions: INSTRUCTIONS,
        prompt: this.buildPrompt(dto, context, site),
        output: ai.Output.object({ schema: insightSchema }),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3,
      });
      const output = result.output;
      return {
        verdict: output.verdict,
        headline: output.headline.trim(),
        summary: output.summary.trim(),
        strengths: output.strengths.slice(0, 4),
        risks: output.risks.slice(0, 4),
        suggestions: output.suggestions.slice(0, 3),
        generatedAt: new Date().toISOString(),
        usedSurroundings: context != null,
      };
    } catch (error) {
      this.logger.error('[expansion:nexo]', error);
      throw new ServiceUnavailableException(
        `${AGENT_NAME} no pudo analizar la ubicación. Intenta de nuevo.`,
      );
    }
  }

  private buildPrompt(
    dto: ExpansionNexoInsightDto,
    context: LocationContext | null,
    site: { description: string | null; comments: { body: string }[] } | null,
  ): string {
    const { analysis } = dto;
    const format = dto.formatCode
      ? (FORMAT_LABELS[dto.formatCode] ?? dto.formatCode)
      : null;
    const size =
      dto.width && dto.height ? `${dto.width} x ${dto.height} m` : null;

    const sections = [
      `Ubicación propuesta: ${dto.name?.trim() || 'sin nombre'} (${dto.latitude.toFixed(5)}, ${dto.longitude.toFixed(5)})`,
      [
        format ? `Formato: ${format}` : 'Formato: sin definir',
        size ? `Medidas: ${size}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      `Economía: precio mensual ${money(dto.estimatedMonthlyPrice ?? analysis.medianPrice)}${
        dto.estimatedMonthlyPrice == null ? ' (precio típico de la zona)' : ''
      }, costo mensual ${money(dto.estimatedMonthlyCost)}, ingreso esperado ${money(
        analysis.estimatedMonthlyRevenue,
      )}/mes, retorno ${analysis.estimatedRoi != null ? `${analysis.estimatedRoi.toFixed(2)}x` : 'sin dato'}, ocupación de equilibrio ${percent(analysis.breakEvenOccupancy)}`,
      `Entorno (OpenStreetMap):\n${surroundingsFacts(context)}`,
      [
        'Inventario VEO alrededor:',
        `- Vallas propias a 500 m: ${analysis.within500m}; a 1 km: ${analysis.within1Km} (zona ${analysis.saturation})`,
        `- Valla más cercana: ${analysis.nearestCode ?? 'ninguna'}${
          analysis.nearestDistanceM != null
            ? ` a ${Math.round(analysis.nearestDistanceM)} m`
            : ''
        }`,
        `- Ocupación de vallas vecinas: ${percent(analysis.avgOccupancy)}; rentabilidad promedio ${
          analysis.avgScore != null
            ? `${Math.round(analysis.avgScore)}/100`
            : 'sin dato'
        }; precio típico ${money(analysis.medianPrice)}`,
      ].join('\n'),
      [
        `Puntaje del sistema: ${Math.round(analysis.score)}/100 → ${analysis.verdict} (confianza ${analysis.confidence})`,
        ...analysis.factors.map(
          (f) =>
            `- ${FACTOR_LABELS[f.key] ?? f.key}: ${Math.round(f.value * 100)}/100 (peso ${f.weight})`,
        ),
        ...analysis.caps.map((cap) => `- Límite aplicado: ${cap}`),
      ].join('\n'),
      site?.description ? `Notas del equipo:\n${site.description}` : null,
      site?.comments.length
        ? `Comentarios recientes del equipo:\n${site.comments.map((c) => `- ${c.body}`).join('\n')}`
        : null,
    ];
    return sections.filter(Boolean).join('\n\n');
  }
}
