import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CrmDealStatus,
  CrmMediaType,
  CrmSiteKind,
  CrmSiteStatus,
  Prisma,
} from '@prisma/client';
import { BillboardsService } from '../billboards/billboards.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrmActivitiesService } from './crm-activities.service.js';
import {
  CrmInventoryService,
  siteKey,
  type InventoryHold,
} from './crm-inventory.service.js';
import { fullName, type CrmAuthUser } from './crm.constants.js';
import {
  HOLD_DEFAULT_DAYS,
  HOLD_WARNING_DAYS,
  addDays,
  calendarDate,
  isoDay,
  siteTotal,
} from './crm-ooh.constants.js';
import type {
  AddDealSitesDto,
  DealSitesActionDto,
  UpdateDealSiteDto,
} from './dto/crm-inventory.dto.js';

export interface CrmDealSiteItem {
  id: string;
  kind: CrmSiteKind;
  billboardId: number | null;
  digitalBillboardId: string | null;
  code: string;
  label: string;
  cityName: string | null;
  departmentName: string | null;
  latitude: number | null;
  longitude: number | null;
  width: number | null;
  height: number | null;
  startDate: string;
  endDate: string;
  spotsPerDay: number | null;
  rate: number;
  total: number;
  status: CrmSiteStatus;
  heldAt: string | null;
  holdUntil: string | null;
  holdExpired: boolean;
  holdExpiringSoon: boolean;
  /** Position among active holds on the same face; 1 is first option. */
  rank: number | null;
  contracted: boolean;
  conflicts: InventoryHold[];
  createdByName: string | null;
}

export interface CrmDealSitesSummary {
  activeCount: number;
  staticCount: number;
  digitalCount: number;
  heldCount: number;
  bookedCount: number;
  expiringCount: number;
  conflictCount: number;
  totalValue: number;
  spotsPerDay: number;
}

export interface CrmDealSites {
  sites: CrmDealSiteItem[];
  summary: CrmDealSitesSummary;
}

export interface AddDealSitesResult extends CrmDealSites {
  added: number;
  warnings: string[];
}

const SITE_INCLUDE = {
  createdBy: { select: { firstName: true, lastName: true } },
} as const satisfies Prisma.CrmDealSiteInclude;

type SiteRow = Prisma.CrmDealSiteGetPayload<{ include: typeof SITE_INCLUDE }>;

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CrmDealSitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: CrmInventoryService,
    private readonly billboards: BillboardsService,
    private readonly activities: CrmActivitiesService,
  ) {}

  async list(dealId: string): Promise<CrmDealSites> {
    await this.findDeal(dealId);
    const rows = await this.prisma.crmDealSite.findMany({
      where: { dealId },
      include: SITE_INCLUDE,
      orderBy: [{ kind: 'asc' }, { code: 'asc' }],
    });
    return this.serializeAll(dealId, rows);
  }

  async add(
    dealId: string,
    dto: AddDealSitesDto,
    user: CrmAuthUser,
  ): Promise<AddDealSitesResult> {
    const deal = await this.findDeal(dealId);
    const start = calendarDate(dto.startDate);
    const end = calendarDate(dto.endDate);
    if (end < start) {
      throw new BadRequestException(
        'La fecha final debe ser posterior a la inicial',
      );
    }
    if (dto.hold && deal.status !== 'OPEN') {
      throw new BadRequestException(
        'Solo se puede reservar en negocios abiertos',
      );
    }

    const snapshot = await this.inventory.resolve(dto.sites, start, end);
    const holds = await this.inventory.activeHolds(start, end, dealId);
    const existing = await this.prisma.crmDealSite.findMany({
      where: { dealId, status: { not: 'RELEASED' } },
      select: { kind: true, billboardId: true, digitalBillboardId: true },
    });
    const taken = new Set(existing.map(siteKey));
    const warnings: string[] = [];
    const now = new Date();
    const holdUntil = addDays(now, dto.holdDays ?? HOLD_DEFAULT_DAYS);
    const data: Prisma.CrmDealSiteCreateManyInput[] = [];

    for (const input of dto.sites) {
      const key = siteKey(input);
      const item = snapshot.get(key);
      if (!item) {
        warnings.push(
          `No se encontró el sitio ${input.billboardId ?? input.digitalBillboardId}.`,
        );
        continue;
      }
      if (taken.has(key)) {
        warnings.push(`${item.code} ya está en el negocio.`);
        continue;
      }
      taken.add(key);

      const spots = item.kind === 'DIGITAL' ? (input.spotsPerDay ?? 30) : null;
      let status: CrmSiteStatus = dto.hold ? 'HELD' : 'PROPOSED';
      if (dto.hold && item.state === 'CONTRACTED') {
        status = 'PROPOSED';
        warnings.push(
          `${item.code} está contratada en esas fechas; se agregó sin reserva.`,
        );
      }
      if (dto.hold && item.kind === 'DIGITAL' && item.capacity != null) {
        const heldSpots = (holds.get(key) ?? []).reduce(
          (s, h) => s + (h.spotsPerDay ?? 0),
          0,
        );
        const free = item.capacity - (item.usedSpots ?? 0) - heldSpots;
        if (spots! > free) {
          status = 'PROPOSED';
          warnings.push(
            `${item.code} solo tiene ${Math.max(0, free)} spots libres por día; se agregó sin reserva.`,
          );
        }
      }

      data.push({
        dealId,
        kind: item.kind,
        billboardId: item.billboardId,
        digitalBillboardId: item.digitalBillboardId,
        code: item.code,
        label: item.label,
        cityName: item.cityName,
        departmentName: item.departmentName,
        latitude: item.latitude,
        longitude: item.longitude,
        width: item.width,
        height: item.height,
        startDate: start,
        endDate: end,
        spotsPerDay: spots,
        rate: input.rate ?? item.rate,
        status,
        heldAt: status === 'HELD' ? now : null,
        holdUntil: status === 'HELD' ? holdUntil : null,
        createdById: user.id,
      });
    }

    if (data.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.crmDealSite.createMany({ data });
        await tx.crmDeal.update({
          where: { id: dealId },
          data: {
            ...(deal.campaignStart ? {} : { campaignStart: start }),
            ...(deal.campaignEnd ? {} : { campaignEnd: end }),
            ...(deal.mediaType
              ? {}
              : { mediaType: inferMediaType(data.map((d) => d.kind)) }),
          },
        });
        const held = data.filter((d) => d.status === 'HELD').length;
        await this.activities.log(
          {
            type: 'INVENTORY_CHANGED',
            subject: held
              ? `${data.length} sitios agregados (${held} reservados)`
              : `${data.length} sitios agregados a la propuesta`,
            dealId,
            clientId: deal.clientId,
            actorId: user.id,
            metadata: { codes: data.map((d) => d.code), held },
          },
          tx,
        );
      });
    }

    return { ...(await this.list(dealId)), added: data.length, warnings };
  }

  async update(
    dealId: string,
    siteId: string,
    dto: UpdateDealSiteDto,
  ): Promise<CrmDealSites> {
    const site = await this.findSite(dealId, siteId);
    const start = dto.startDate ? calendarDate(dto.startDate) : site.startDate;
    const end = dto.endDate ? calendarDate(dto.endDate) : site.endDate;
    if (end < start) {
      throw new BadRequestException(
        'La fecha final debe ser posterior a la inicial',
      );
    }
    await this.prisma.crmDealSite.update({
      where: { id: siteId },
      data: {
        startDate: start,
        endDate: end,
        ...(dto.rate !== undefined ? { rate: dto.rate } : {}),
        ...(dto.spotsPerDay !== undefined && site.kind === 'DIGITAL'
          ? { spotsPerDay: dto.spotsPerDay }
          : {}),
      },
    });
    return this.list(dealId);
  }

  async action(
    dealId: string,
    dto: DealSitesActionDto,
    user: CrmAuthUser,
  ): Promise<CrmDealSites> {
    const deal = await this.findDeal(dealId);
    const sites = await this.prisma.crmDealSite.findMany({
      where: { dealId, id: { in: dto.siteIds } },
    });
    if (sites.length === 0)
      throw new NotFoundException('Sitios no encontrados');
    const ids = sites.map((s) => s.id);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      switch (dto.action) {
        case 'hold': {
          if (deal.status !== 'OPEN') {
            throw new BadRequestException(
              'Solo se puede reservar en negocios abiertos',
            );
          }
          const holdUntil = addDays(now, dto.holdDays ?? HOLD_DEFAULT_DAYS);
          for (const site of sites) {
            const keepRank =
              site.status === 'HELD' && site.holdUntil && site.holdUntil > now;
            await tx.crmDealSite.update({
              where: { id: site.id },
              data: {
                status: 'HELD',
                holdUntil,
                heldAt: keepRank ? site.heldAt : now,
              },
            });
          }
          break;
        }
        case 'release':
          await tx.crmDealSite.updateMany({
            where: { id: { in: ids } },
            data: { status: 'RELEASED', holdUntil: null },
          });
          break;
        case 'propose':
          await tx.crmDealSite.updateMany({
            where: { id: { in: ids } },
            data: { status: 'PROPOSED', holdUntil: null, heldAt: null },
          });
          break;
        case 'remove':
          await tx.crmDealSite.deleteMany({ where: { id: { in: ids } } });
          break;
      }
      await this.activities.log(
        {
          type: 'INVENTORY_CHANGED',
          subject: `${ACTION_LABELS[dto.action]}: ${sites.map((s) => s.code).join(', ')}`,
          dealId,
          clientId: deal.clientId,
          actorId: user.id,
          metadata: { action: dto.action, codes: sites.map((s) => s.code) },
        },
        tx,
      );
    });
    return this.list(dealId);
  }

  /** Keeps holds in step with the deal: won books them, lost releases them, reopening re-holds. */
  async syncWithDealStatus(
    dealId: string,
    status: CrmDealStatus,
    tx: Prisma.TransactionClient,
  ) {
    const now = new Date();
    if (status === 'WON') {
      await tx.crmDealSite.updateMany({
        where: { dealId, status: { in: ['PROPOSED', 'HELD'] } },
        data: { status: 'BOOKED', holdUntil: null },
      });
    } else if (status === 'LOST') {
      await tx.crmDealSite.updateMany({
        where: { dealId, status: { not: 'RELEASED' } },
        data: { status: 'RELEASED', holdUntil: null },
      });
    } else {
      await tx.crmDealSite.updateMany({
        where: { dealId, status: 'BOOKED' },
        data: {
          status: 'HELD',
          heldAt: now,
          holdUntil: addDays(now, HOLD_DEFAULT_DAYS),
        },
      });
    }
  }

  private async serializeAll(
    dealId: string,
    rows: SiteRow[],
  ): Promise<CrmDealSites> {
    const live = rows.filter((r) => r.status !== 'RELEASED');
    const now = Date.now();
    let holds = new Map<string, InventoryHold[]>();
    let contracted = new Set<number>();

    if (live.length > 0) {
      const from = new Date(
        Math.min(...live.map((r) => r.startDate.getTime())),
      );
      const to = new Date(Math.max(...live.map((r) => r.endDate.getTime())));
      const [allHolds, staticRows] = await Promise.all([
        this.inventory.activeHolds(from, to),
        live.some((r) => r.kind === 'STATIC')
          ? this.billboards.getAvailableBillboardsInRange(from, to, {
              includeUnavailable: true,
            })
          : Promise.resolve([]),
      ]);
      holds = allHolds;
      contracted = new Set(
        staticRows.filter((r) => !r.isAvailable).map((r) => r.billboardId),
      );
    }

    const sites = rows.map((row): CrmDealSiteItem => {
      const faceHolds = holds.get(siteKey(row)) ?? [];
      const overlapping = faceHolds.filter(
        (h) =>
          h.dealId !== dealId &&
          calendarDate(h.startDate) <= row.endDate &&
          calendarDate(h.endDate) >= row.startDate,
      );
      const own = faceHolds.find((h) => h.siteId === row.id);
      const expired =
        row.status === 'HELD' &&
        !!row.holdUntil &&
        row.holdUntil.getTime() <= now;
      return {
        id: row.id,
        kind: row.kind,
        billboardId: row.billboardId,
        digitalBillboardId: row.digitalBillboardId,
        code: row.code,
        label: row.label,
        cityName: row.cityName,
        departmentName: row.departmentName,
        latitude: row.latitude,
        longitude: row.longitude,
        width: row.width,
        height: row.height,
        startDate: isoDay(row.startDate)!,
        endDate: isoDay(row.endDate)!,
        spotsPerDay: row.spotsPerDay,
        rate: row.rate,
        total: siteTotal(row.rate, row.startDate, row.endDate),
        status: row.status,
        heldAt: row.heldAt?.toISOString() ?? null,
        holdUntil: row.holdUntil?.toISOString() ?? null,
        holdExpired: expired,
        holdExpiringSoon:
          row.status === 'HELD' &&
          !expired &&
          !!row.holdUntil &&
          row.holdUntil.getTime() - now < HOLD_WARNING_DAYS * DAY_MS,
        rank: own && row.kind === 'STATIC' ? own.rank : null,
        contracted:
          row.kind === 'STATIC' &&
          row.status !== 'BOOKED' &&
          row.billboardId != null &&
          contracted.has(row.billboardId),
        conflicts: row.status === 'RELEASED' ? [] : overlapping,
        createdByName: row.createdBy ? fullName(row.createdBy) : null,
      };
    });

    sites.sort(
      (a, b) =>
        Number(a.status === 'RELEASED') - Number(b.status === 'RELEASED'),
    );
    const active = sites.filter((s) => s.status !== 'RELEASED');
    return {
      sites,
      summary: {
        activeCount: active.length,
        staticCount: active.filter((s) => s.kind === 'STATIC').length,
        digitalCount: active.filter((s) => s.kind === 'DIGITAL').length,
        heldCount: active.filter((s) => s.status === 'HELD' && !s.holdExpired)
          .length,
        bookedCount: active.filter((s) => s.status === 'BOOKED').length,
        expiringCount: active.filter((s) => s.holdExpiringSoon || s.holdExpired)
          .length,
        conflictCount: active.filter(
          (s) => s.conflicts.length > 0 || s.contracted,
        ).length,
        totalValue:
          Math.round(active.reduce((sum, s) => sum + s.total, 0) * 100) / 100,
        spotsPerDay: active.reduce((sum, s) => sum + (s.spotsPerDay ?? 0), 0),
      },
    };
  }

  private async findDeal(id: string) {
    const deal = await this.prisma.crmDeal.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        clientId: true,
        campaignStart: true,
        campaignEnd: true,
        mediaType: true,
      },
    });
    if (!deal) throw new NotFoundException('Negocio no encontrado');
    return deal;
  }

  private async findSite(dealId: string, siteId: string) {
    const site = await this.prisma.crmDealSite.findUnique({
      where: { id: siteId },
    });
    if (!site || site.dealId !== dealId)
      throw new NotFoundException('Sitio no encontrado');
    return site;
  }
}

const ACTION_LABELS: Record<DealSitesActionDto['action'], string> = {
  hold: 'Reserva',
  release: 'Reserva liberada',
  propose: 'Vuelve a propuesta',
  remove: 'Sitios quitados',
};

export function inferMediaType(kinds: CrmSiteKind[]): CrmMediaType {
  const set = new Set(kinds);
  if (set.size > 1) return 'MIXED';
  return set.has('DIGITAL') ? 'DIGITAL' : 'STATIC';
}
