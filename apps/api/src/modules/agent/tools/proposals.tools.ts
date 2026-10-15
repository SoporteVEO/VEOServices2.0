import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import { normalizeText } from '../agent-text-similarity.js';
import { researchWeb } from '../agent-web-research.js';
import {
  type AgentToolContext,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato YYYY-MM-DD');

const MAX_FACETS = 15;

interface InventoryBillboard {
  billboardId: number;
  billboardCode: string | null;
  reference: string | null;
  address: string | null;
  departmentName: string | null;
  cityName: string | null;
  streetName: string | null;
  height: number | null;
  width: number | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  monthsWithoutPurchase: number | null;
  isAvailable: boolean;
}

function matchesPlace(value: string | null, wanted?: string): boolean {
  if (!wanted) return true;
  return normalizeText(value ?? '').includes(normalizeText(wanted));
}

function keywordHits(billboard: InventoryBillboard, keywords: string[]) {
  const haystack = normalizeText(
    [
      billboard.address,
      billboard.reference,
      billboard.streetName,
      billboard.cityName,
    ]
      .filter(Boolean)
      .join(' '),
  );
  return keywords.filter((k) => haystack.includes(normalizeText(k))).length;
}

function facet(
  rows: InventoryBillboard[],
  pick: (b: InventoryBillboard) => string | null,
) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = pick(row);
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_FACETS)
    .map(([label, count]) => ({ label, count }));
}

function canPropose(ctx: AgentToolContext) {
  return hasScope(ctx.user, 'static_billboards');
}

export function buildProposalTools(ctx: AgentToolContext) {
  return {
    research_company: defineTool({
      description:
        'Researches a company or brand on the web (what it sells, its presence and recent news in El Salvador, audience, campaign tone) to tailor a billboard proposal. Use it when the user asks for a proposal, pitch or report for a company/brand, or asks you to investigate a client. The chat shows the brief with its sources; summarize only what matters for the proposal.',
      inputSchema: z.object({
        company: z
          .string()
          .min(2)
          .max(120)
          .describe('Company or brand name, e.g. "Coca-Cola"'),
        focus: z
          .string()
          .max(300)
          .optional()
          .describe(
            'What the proposal is about, e.g. "nuevo negocio en San Salvador"',
          ),
      }),
      execute: async ({ company, focus }) => {
        if (!canPropose(ctx) && !hasScope(ctx.user, 'crm')) {
          return unauthorized('static_billboards');
        }
        try {
          const research = await researchWeb(
            [
              `Empresa o marca: ${company}.`,
              focus ? `Contexto de la propuesta: ${focus}.` : null,
              'Investiga su presencia en El Salvador para una propuesta de publicidad exterior.',
            ]
              .filter(Boolean)
              .join('\n'),
          );
          return {
            ok: true as const,
            company,
            focus: focus ?? null,
            researchedAt: new Date().toISOString(),
            ...research,
          };
        } catch (error) {
          return {
            ok: false as const,
            error: `No se pudo investigar en la web: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      },
      toModelOutput: ({ output }) =>
        toModelText(
          output.ok
            ? {
                summary: output.summary,
                sources: output.sources.map((s) => s.title),
                note: 'El resumen y sus fuentes ya se muestran al usuario.',
              }
            : output,
        ),
    }),

    search_billboard_inventory: defineTool({
      description:
        'Searches the static billboard inventory available for a date range, filtered by department, city and/or keywords matched against the address, reference and street (e.g. "Masferrer", "Los Próceres", "Multiplaza", "Carretera al Puerto"). Returns code, location, size, monthly price and coordinates so you can pick the billboards that best fit a client. When nothing matches, it returns the departments and cities that do have inventory.',
      inputSchema: z.object({
        from: isoDate.describe('Campaign start (YYYY-MM-DD)'),
        to: isoDate.describe('Campaign end (YYYY-MM-DD)'),
        department: z
          .string()
          .optional()
          .describe('Department, e.g. "San Salvador", "La Libertad"'),
        city: z
          .string()
          .optional()
          .describe(
            'City/municipality, e.g. "Antiguo Cuscatlán", "Santa Tecla"',
          ),
        keywords: z
          .array(z.string().min(2))
          .max(10)
          .optional()
          .describe('Any of these words in the address or reference'),
        maxPrice: z
          .number()
          .positive()
          .optional()
          .describe('Maximum monthly price in USD'),
        includeOccupied: z
          .boolean()
          .default(false)
          .describe('Also return billboards already sold in the range'),
        limit: z.number().int().min(1).max(60).default(40),
      }),
      execute: async (input) => {
        if (!canPropose(ctx)) return unauthorized('static_billboards');
        if (input.from > input.to) {
          return {
            ok: false as const,
            error: 'La fecha inicial es posterior a la final',
          };
        }

        const response = await ctx.api.request<{ data: InventoryBillboard[] }>({
          method: 'GET',
          path: '/billboards/available',
          query: {
            from: input.from,
            to: input.to,
            includeUnavailable: input.includeOccupied,
          },
        });
        if (!response.ok) return { ok: false as const, error: response.error };

        const all = response.data?.data ?? [];
        const keywords = input.keywords ?? [];
        const ranked = all
          .filter(
            (b) =>
              matchesPlace(b.departmentName, input.department) &&
              matchesPlace(b.cityName, input.city) &&
              (input.maxPrice == null || (b.price ?? 0) <= input.maxPrice),
          )
          .map((b) => ({ b, hits: keywordHits(b, keywords) }))
          .filter(({ hits }) => keywords.length === 0 || hits > 0)
          .sort((x, y) => y.hits - x.hits);

        const billboards = ranked.slice(0, input.limit).map(({ b }) => ({
          code: b.billboardCode,
          address: b.address,
          reference: b.reference,
          city: b.cityName,
          department: b.departmentName,
          size: b.width && b.height ? `${b.width} x ${b.height} m` : null,
          monthlyPrice: b.price,
          available: b.isAvailable,
          monthsWithoutPurchase: b.monthsWithoutPurchase,
          lat: b.latitude,
          lng: b.longitude,
        }));

        return {
          ok: true as const,
          from: input.from,
          to: input.to,
          filters: {
            department: input.department ?? null,
            city: input.city ?? null,
            keywords,
            maxPrice: input.maxPrice ?? null,
          },
          inventorySize: all.length,
          matched: ranked.length,
          billboards,
          ...(ranked.length === 0 && {
            note: 'Ningún espacio coincide con esos filtros. Usa los departamentos y ciudades con inventario para ampliar la búsqueda o pregunta al usuario.',
            departments: facet(all, (b) => b.departmentName),
            cities: facet(
              all.filter((b) =>
                matchesPlace(b.departmentName, input.department),
              ),
              (b) => b.cityName,
            ),
          }),
        };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),

    create_client_proposal: defineTool({
      description:
        'Builds a branded PDF proposal of static billboards for a specific company, addressed to its contact (e.g. the marketing manager): cover, brand context and objective, strategy, one page per recommended billboard with its photo, location and the reason it fits, investment summary and VEO closing pages. Call it only after research_company and search_billboard_inventory, with billboards you actually found available. The chat shows a card with the download button; do not repeat its content.',
      inputSchema: z.object({
        company: z.string().min(2).max(120).describe('Brand/company name'),
        contact: z
          .object({
            name: z.string().max(120).optional(),
            role: z.string().max(120).default('Gerente de Marketing'),
            email: z.string().max(200).optional(),
          })
          .default({ role: 'Gerente de Marketing' }),
        objective: z
          .string()
          .min(5)
          .max(300)
          .describe(
            'Business objective, e.g. "Lanzamiento de su nuevo negocio en San Salvador"',
          ),
        from: isoDate.describe('Campaign start (YYYY-MM-DD)'),
        to: isoDate.describe('Campaign end (YYYY-MM-DD)'),
        brandSummary: z
          .string()
          .min(20)
          .max(900)
          .describe('2-4 sentences about the brand, based on research_company'),
        audience: z
          .string()
          .max(300)
          .optional()
          .describe('Target audience of the campaign'),
        strategy: z
          .array(z.string().min(5).max(280))
          .min(2)
          .max(5)
          .describe('Why this mix of billboards meets the objective'),
        billboards: z
          .array(
            z.object({
              code: z.string().min(2).max(30),
              reason: z
                .string()
                .min(10)
                .max(280)
                .describe('Why this billboard fits the brand and objective'),
            }),
          )
          .min(1)
          .max(20),
      }),
      execute: async (input) => {
        if (!canPropose(ctx)) return unauthorized('static_billboards');
        if (input.from > input.to) {
          return {
            ok: false as const,
            error: 'La fecha inicial es posterior a la final',
          };
        }

        const response = await ctx.api.request<{ data: InventoryBillboard[] }>({
          method: 'GET',
          path: '/billboards/available',
          query: { from: input.from, to: input.to, includeUnavailable: true },
        });
        if (!response.ok) return { ok: false as const, error: response.error };

        const byCode = new Map(
          (response.data?.data ?? []).map((b) => [
            b.billboardCode?.trim().toUpperCase(),
            b,
          ]),
        );
        const included: {
          code: string;
          billboardId: number;
          city: string | null;
          monthlyPrice: number | null;
        }[] = [];
        const occupiedCodes: string[] = [];
        const missingCodes: string[] = [];
        for (const { code } of input.billboards) {
          const billboard = byCode.get(code.trim().toUpperCase());
          if (!billboard) missingCodes.push(code);
          else if (!billboard.isAvailable) occupiedCodes.push(code);
          else if (
            !included.some((i) => i.billboardId === billboard.billboardId)
          ) {
            included.push({
              code: billboard.billboardCode ?? code,
              billboardId: billboard.billboardId,
              city: billboard.cityName,
              monthlyPrice: billboard.price,
            });
          }
        }

        if (included.length === 0) {
          return {
            ok: false as const,
            error:
              'Ninguna de las vallas elegidas está disponible en ese periodo. Busca otras con search_billboard_inventory.',
            occupiedCodes,
            missingCodes,
          };
        }

        return {
          ok: true as const,
          company: input.company,
          from: input.from,
          to: input.to,
          billboardIds: included.map((i) => i.billboardId),
          included,
          occupiedCodes,
          missingCodes,
          monthlyInvestment: included.reduce(
            (sum, i) => sum + (i.monthlyPrice ?? 0),
            0,
          ),
          preparedBy: [ctx.user.firstName, ctx.user.lastName]
            .filter(Boolean)
            .join(' '),
          preparedByEmail: ctx.user.email,
          createdAt: new Date().toISOString(),
        };
      },
      toModelOutput: ({ output }) =>
        toModelText(
          output.ok === true
            ? {
                included: output.included.map((i) => i.code),
                occupiedCodes: output.occupiedCodes,
                missingCodes: output.missingCodes,
                monthlyInvestment: output.monthlyInvestment,
                note: 'La propuesta ya se muestra al usuario con su botón de descarga. Si hubo vallas ocupadas o inexistentes, menciónalo.',
              }
            : output,
        ),
    }),
  };
}
