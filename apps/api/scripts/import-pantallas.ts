/**
 * One-off import of the "LISTAS VNNOX" JSON (DOOH - Producción) into Pantallas.
 *
 *   npx tsx scripts/import-pantallas.ts "<ruta>/datos listas vnnox.json"          (dry run)
 *   npx tsx scripts/import-pantallas.ts "<ruta>/datos listas vnnox.json" --apply
 *
 * Screens are matched by code or name. Their manually entered campaigns and
 * the whole bitácora are replaced by the file; campaigns that came from an
 * accepted quotation are kept.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  DigitalBillboardLogType,
  DigitalCampaignArt,
  DigitalCampaignDeal,
  PrismaClient,
} from '@prisma/client';
import { normalizeAlias } from '../src/modules/digital-billboards/digital-billboards.service.js';
import { fromIsoDate } from '../src/modules/digital-billboards/pantallas-rules.js';

interface SourceVersion {
  titulo?: string;
  inicio?: string | null;
  fin?: string | null;
}

interface SourceCampaign {
  cliente?: string;
  campana?: string;
  inicio?: string | null;
  fin?: string | null;
  frec?: number | string;
  notas?: string;
  pausada?: boolean;
  motivoPausa?: string;
  arte?: string;
  neg?: string;
  vMes?: number | string | null;
  vSpot?: number | string | null;
  vTotal?: number | string | null;
  versiones?: SourceVersion[];
}

interface SourceScreen {
  id: string;
  nombre: string;
  codigo?: string;
  on?: string;
  off?: string;
  ultimo?: { cliente?: string; accion?: string; ts?: string };
  sublistas: { nombre: string; capacidad: number; campanas: SourceCampaign[] }[];
}

interface SourceLog {
  ts: string;
  tipo: string;
  cliente?: string;
  campana?: string;
  pantalla?: string;
  sublista?: string;
  frec?: number;
  inicio?: string;
  fin?: string;
  finAntes?: string;
  frecAntes?: number;
  detalle?: string;
  op?: string;
  nueva?: boolean;
}

interface SourceData {
  spotsPorHora?: number;
  minHoras?: number;
  pantallas: SourceScreen[];
  bitacora?: SourceLog[];
}

const ALIASES: Record<string, string[]> = {
  sdm: ['salvador del mundo', 'salvador', 'sdm'],
  heroe: ['heroes', 'monumento a los heroes'],
  panam: ['panamericana', 'panam'],
  proce: ['proceres', 'los proceres', 'proce'],
  paseo: ['paseo general escalon', 'paseo escalon', 'paseo'],
  jerusa: ['jerusalen', 'jerusa'],
  benito: ['san benito', 'benito'],
  juanpa: ['constitucion', 'juan pablo', 'juanpa'],
};

const ART: Record<string, DigitalCampaignArt> = {
  sin: DigitalCampaignArt.MISSING,
  aprob: DigitalCampaignArt.PENDING_APPROVAL,
};

const DEAL: Record<string, DigitalCampaignDeal> = {
  donacion: DigitalCampaignDeal.DONATION,
  canje: DigitalCampaignDeal.EXCHANGE,
  dacion: DigitalCampaignDeal.DATION,
  bonificacion: DigitalCampaignDeal.BONUS,
};

const LOG_TYPE: Record<string, DigitalBillboardLogType> = {
  alta: DigitalBillboardLogType.NEW,
  renovada: DigitalBillboardLogType.RENEWED,
  extendida: DigitalBillboardLogType.EXTENDED,
  recortada: DigitalBillboardLogType.SHORTENED,
  editada: DigitalBillboardLogType.EDITED,
  frecuencia: DigitalBillboardLogType.EDITED,
  pausada: DigitalBillboardLogType.PAUSED,
  reanudada: DigitalBillboardLogType.RESUMED,
  movida: DigitalBillboardLogType.MOVED,
  baja: DigitalBillboardLogType.REMOVED,
};

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(String(value).replace(/[^0-9.,-]/g, '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function isoOrNull(value: string | null | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  if (!file) {
    console.error('Uso: npx tsx scripts/import-pantallas.ts "<archivo.json>" [--apply]');
    process.exit(1);
  }
  const apply = flags.includes('--apply');
  const source = JSON.parse(readFileSync(file, 'utf8')) as SourceData;
  if (!Array.isArray(source.pantallas)) throw new Error('El archivo no tiene "pantallas".');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const existing = await prisma.digitalBillboard.findMany({
    select: { id: true, code: true, name: true },
  });
  const findExisting = (screen: SourceScreen) => {
    const code = (screen.codigo || screen.id).toUpperCase();
    const name = normalizeAlias(screen.nombre);
    return (
      existing.find((e) => e.code.toUpperCase() === code) ??
      existing.find((e) => normalizeAlias(e.name) === name)
    );
  };

  for (const screen of source.pantallas) {
    const match = findExisting(screen);
    const campaigns = screen.sublistas.reduce((n, s) => n + s.campanas.length, 0);
    console.log(
      `${screen.nombre.padEnd(28)} ${match ? `actualiza ${match.code}` : 'nueva'} · ${screen.sublistas.length} sublistas · ${campaigns} campañas`,
    );
  }
  console.log(`Bitácora: ${source.bitacora?.length ?? 0} movimientos (reemplaza la actual)`);

  if (!apply) {
    console.log('\nSimulación. Vuelve a correrlo con --apply para escribir en la base.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.digitalBillboardSettings.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          spotsPerHour: source.spotsPorHora ?? 450,
          minHours: source.minHoras ?? 16.5,
        },
        update: {
          spotsPerHour: source.spotsPorHora ?? 450,
          minHours: source.minHoras ?? 16.5,
        },
      });

      for (const [index, screen] of source.pantallas.entries()) {
        const code = (screen.codigo || screen.id).toUpperCase();
        const aliases = [
          ...new Set([...(ALIASES[screen.id] ?? []), normalizeAlias(screen.nombre)]),
        ];
        const lastChange = screen.ultimo?.cliente
          ? {
              lastChangeClient: screen.ultimo.cliente,
              lastChangeAction: screen.ultimo.accion ?? '',
              lastChangeAt: screen.ultimo.ts ? new Date(screen.ultimo.ts) : null,
            }
          : {};
        const schedule = {
          turnOnAt: screen.on || '05:30',
          turnOffAt: screen.off || '22:00',
        };

        const match = findExisting(screen);
        let screenId: string;
        if (match) {
          const codeTaken = existing.some(
            (e) => e.id !== match.id && e.code.toUpperCase() === code,
          );
          await tx.digitalBillboard.update({
            where: { id: match.id },
            data: {
              ...(codeTaken ? {} : { code }),
              name: screen.nombre,
              position: index,
              aliases,
              ...schedule,
              ...lastChange,
            },
          });
          screenId = match.id;

          await tx.digitalBillboardCampaign.deleteMany({
            where: { offerItemId: null, sublist: { digitalBillboardId: screenId } },
          });
          await tx.digitalBillboardSublist.deleteMany({
            where: { digitalBillboardId: screenId, campaigns: { none: {} } },
          });
        } else {
          const created = await tx.digitalBillboard.create({
            data: {
              code,
              name: screen.nombre,
              address: '',
              latitude: 0,
              longitude: 0,
              price: 0,
              position: index,
              aliases,
              ...schedule,
              ...lastChange,
            },
          });
          screenId = created.id;
        }

        const kept = await tx.digitalBillboardSublist.count({
          where: { digitalBillboardId: screenId },
        });
        for (const [subIndex, sublist] of screen.sublistas.entries()) {
          const createdSublist = await tx.digitalBillboardSublist.create({
            data: {
              digitalBillboardId: screenId,
              name: sublist.nombre,
              capacity: Number(sublist.capacidad) || 900,
              position: kept + subIndex,
            },
          });
          for (const c of sublist.campanas) {
            await tx.digitalBillboardCampaign.create({
              data: {
                sublistId: createdSublist.id,
                client: (c.cliente ?? '').trim() || 'SIN CLIENTE',
                campaign: (c.campana ?? '').trim(),
                startDate: fromIsoDate(isoOrNull(c.inicio)),
                endDate: fromIsoDate(isoOrNull(c.fin)),
                spotsPerDay: Math.round(Number(c.frec) || 0),
                notes: c.notas?.trim() || null,
                paused: !!c.pausada,
                pauseReason: c.pausada ? c.motivoPausa?.trim() || null : null,
                art: ART[c.arte ?? ''] ?? DigitalCampaignArt.RECEIVED,
                deal: DEAL[c.neg ?? ''] ?? DigitalCampaignDeal.COMMERCIAL,
                monthlyValue: num(c.vMes),
                spotValue: num(c.vSpot),
                totalValue: num(c.vTotal),
                versions: {
                  create: (c.versiones ?? []).map((v, position) => ({
                    title: (v.titulo ?? '').trim(),
                    startDate: fromIsoDate(isoOrNull(v.inicio)),
                    endDate: fromIsoDate(isoOrNull(v.fin)),
                    position,
                  })),
                },
              },
            });
          }
        }
      }

      await tx.digitalBillboardLog.deleteMany({});
      const logs = (source.bitacora ?? []).filter((l) => LOG_TYPE[l.tipo]);
      if (logs.length) {
        await tx.digitalBillboardLog.createMany({
          data: logs.map((l) => ({
            type: LOG_TYPE[l.tipo],
            client: (l.cliente ?? '').trim() || 'SIN CLIENTE',
            campaign: l.campana?.trim() || null,
            screenName: l.pantalla ?? '',
            sublistName: l.sublista ?? null,
            spotsPerDay: l.frec ?? null,
            startDate: fromIsoDate(isoOrNull(l.inicio)),
            endDate: fromIsoDate(isoOrNull(l.fin)),
            previousEndDate: fromIsoDate(isoOrNull(l.finAntes)),
            previousSpotsPerDay: l.frecAntes ?? null,
            detail: l.detalle || null,
            orderGroupId: l.op ?? null,
            newSublist: !!l.nueva,
            actorName: 'Importado de LISTAS VNNOX',
            createdAt: new Date(l.ts),
          })),
        });
      }
    },
    { timeout: 180_000, maxWait: 20_000 },
  );

  console.log('\nImportación completa.');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
