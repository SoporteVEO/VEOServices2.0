import { BadRequestException, Injectable } from '@nestjs/common';
import type { CrmSiteKind, Prisma } from '@prisma/client';
import { BillboardsService } from '../billboards/billboards.service.js';
import { PantallasCapacityService } from '../digital-billboards/pantallas-capacity.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { fullName } from './crm.constants.js';
import {
  INVENTORY_MAX_RESULTS,
  calendarDate,
  isoDay,
  normalizeText,
} from './crm-ooh.constants.js';
import type { InventoryQueryDto } from './dto/crm-inventory.dto.js';

export type InventoryState =
  | 'AVAILABLE'
  | 'HELD'
  | 'BOOKED'
  | 'CONTRACTED'
  | 'FULL';

export interface InventoryHold {
  siteId: string;
  dealId: string;
  dealTitle: string;
  ownerName: string;
  status: 'HELD' | 'BOOKED';
  holdUntil: string | null;
  rank: number;
  brand: string | null;
  industry: string | null;
  spotsPerDay: number | null;
  startDate: string;
  endDate: string;
}

export interface InventoryItem {
  key: string;
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
  formatCode: string | null;
  structureName: string | null;
  rate: number;
  state: InventoryState;
  capacity: number | null;
  usedSpots: number | null;
  heldSpots: number | null;
  freeSpots: number | null;
  holds: InventoryHold[];
  competitorConflict: boolean;
  inDeal: boolean;
}

export interface InventoryResult {
  from: string;
  to: string;
  items: InventoryItem[];
  departments: string[];
  totals: Record<InventoryState, number>;
  truncated: boolean;
}

export interface SiteRef {
  kind: CrmSiteKind;
  billboardId?: number | null;
  digitalBillboardId?: string | null;
}

const ACTIVE_HOLD_SELECT = {
  id: true,
  dealId: true,
  billboardId: true,
  digitalBillboardId: true,
  status: true,
  heldAt: true,
  holdUntil: true,
  spotsPerDay: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  deal: {
    select: {
      title: true,
      brand: true,
      industry: true,
      owner: { select: { firstName: true, lastName: true } },
    },
  },
} as const satisfies Prisma.CrmDealSiteSelect;

type ActiveHoldRow = Prisma.CrmDealSiteGetPayload<{
  select: typeof ACTIVE_HOLD_SELECT;
}>;

export function siteKey(ref: SiteRef): string {
  return ref.kind === 'STATIC'
    ? `STATIC:${ref.billboardId}`
    : `DIGITAL:${ref.digitalBillboardId}`;
}

/** Held sites stop counting once `holdUntil` passes, even before anyone releases them. */
export function activeHoldWhere(
  now = new Date(),
): Prisma.CrmDealSiteWhereInput {
  return {
    OR: [{ status: 'BOOKED' }, { status: 'HELD', holdUntil: { gt: now } }],
  };
}

@Injectable()
export class CrmInventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billboards: BillboardsService,
    private readonly capacity: PantallasCapacityService,
  ) {}

  async search(query: InventoryQueryDto): Promise<InventoryResult> {
    const from = calendarDate(query.from);
    const to = calendarDate(query.to);
    if (to < from) {
      throw new BadRequestException(
        'La fecha final debe ser posterior a la inicial',
      );
    }

    const deal = query.dealId
      ? await this.prisma.crmDeal.findUnique({
          where: { id: query.dealId },
          select: {
            industry: true,
            sites: {
              select: {
                billboardId: true,
                digitalBillboardId: true,
                kind: true,
                status: true,
              },
            },
          },
        })
      : null;
    const industry = normalizeText(query.industry ?? deal?.industry);
    const inDeal = new Set(
      (deal?.sites ?? [])
        .filter((s) => s.status !== 'RELEASED')
        .map((s) => siteKey(s)),
    );

    let items = await this.loadInventory(from, to, query.kind);
    const holds = await this.activeHolds(from, to, query.dealId);

    items = items.map((item) => {
      const itemHolds = holds.get(item.key) ?? [];
      const heldSpots = itemHolds.reduce(
        (sum, h) => sum + (h.spotsPerDay ?? 0),
        0,
      );
      const competitorConflict =
        !!industry &&
        itemHolds.some((h) => normalizeText(h.industry) === industry);
      return this.withState({
        ...item,
        holds: itemHolds,
        heldSpots: item.kind === 'DIGITAL' ? heldSpots : null,
        competitorConflict,
        inDeal: inDeal.has(item.key),
      });
    });

    const departments = [
      ...new Set(
        items.map((i) => i.departmentName).filter((d): d is string => !!d),
      ),
    ].sort((a, b) => a.localeCompare(b, 'es'));

    const department = normalizeText(query.department);
    const term = normalizeText(query.search);
    const filtered = items.filter((item) => {
      if (department && normalizeText(item.departmentName) !== department)
        return false;
      if (
        query.onlyAvailable === 'true' &&
        item.state !== 'AVAILABLE' &&
        item.state !== 'HELD'
      )
        return false;
      if (!term) return true;
      return [item.code, item.label, item.cityName].some((v) =>
        normalizeText(v).includes(term),
      );
    });

    const totals: Record<InventoryState, number> = {
      AVAILABLE: 0,
      HELD: 0,
      BOOKED: 0,
      CONTRACTED: 0,
      FULL: 0,
    };
    for (const item of filtered) totals[item.state] += 1;

    return {
      from: isoDay(from)!,
      to: isoDay(to)!,
      items: filtered.slice(0, INVENTORY_MAX_RESULTS),
      departments,
      totals,
      truncated: filtered.length > INVENTORY_MAX_RESULTS,
    };
  }

  /** Inventory snapshot for the given refs, used when adding them to a deal. */
  async resolve(
    refs: SiteRef[],
    from: Date,
    to: Date,
  ): Promise<Map<string, InventoryItem>> {
    const kinds = new Set(refs.map((r) => r.kind));
    const kind = kinds.size === 1 ? [...kinds][0] : undefined;
    const items = await this.loadInventory(from, to, kind);
    const wanted = new Set(refs.map(siteKey));
    return new Map(
      items.filter((i) => wanted.has(i.key)).map((i) => [i.key, i]),
    );
  }

  /** Active holds and bookings of other deals overlapping the range, ranked by hold time. */
  async activeHolds(
    from: Date,
    to: Date,
    excludeDealId?: string,
  ): Promise<Map<string, InventoryHold[]>> {
    const rows = await this.prisma.crmDealSite.findMany({
      where: {
        ...activeHoldWhere(),
        startDate: { lte: to },
        endDate: { gte: from },
        ...(excludeDealId ? { dealId: { not: excludeDealId } } : {}),
      },
      select: ACTIVE_HOLD_SELECT,
    });
    return groupHolds(rows);
  }

  private async loadInventory(
    from: Date,
    to: Date,
    kind?: CrmSiteKind,
  ): Promise<InventoryItem[]> {
    const [staticItems, digitalItems] = await Promise.all([
      kind === 'DIGITAL' ? [] : this.loadStatic(from, to),
      kind === 'STATIC' ? [] : this.loadDigital(from, to),
    ]);
    return [...digitalItems, ...staticItems];
  }

  private async loadStatic(from: Date, to: Date): Promise<InventoryItem[]> {
    const rows = await this.billboards.getAvailableBillboardsInRange(from, to, {
      includeUnavailable: true,
    });
    return rows.map((row) => ({
      key: `STATIC:${row.billboardId}`,
      kind: 'STATIC' as const,
      billboardId: row.billboardId,
      digitalBillboardId: null,
      code: row.billboardCode ?? String(row.billboardId),
      label: [row.address, row.reference].filter(Boolean).join(' · ') || '—',
      cityName: row.cityName,
      departmentName: row.departmentName,
      latitude: row.latitude,
      longitude: row.longitude,
      width: row.width,
      height: row.height,
      formatCode: row.formatCode,
      structureName: row.structureName,
      rate: row.price ?? 0,
      state: row.isAvailable ? 'AVAILABLE' : 'CONTRACTED',
      capacity: null,
      usedSpots: null,
      heldSpots: null,
      freeSpots: null,
      holds: [],
      competitorConflict: false,
      inDeal: false,
    }));
  }

  private async loadDigital(from: Date, to: Date): Promise<InventoryItem[]> {
    const [screens, availability] = await Promise.all([
      this.prisma.digitalBillboard.findMany({
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
          price: true,
          departmentName: true,
        },
      }),
      this.capacity.availabilityInRange(from, to),
    ]);
    return screens.map((screen) => {
      const slot = availability.get(screen.id);
      return {
        key: `DIGITAL:${screen.id}`,
        kind: 'DIGITAL' as const,
        billboardId: null,
        digitalBillboardId: screen.id,
        code: screen.code,
        label: `${screen.name} · ${screen.address}`,
        cityName: null,
        departmentName: screen.departmentName,
        latitude: screen.latitude,
        longitude: screen.longitude,
        width: null,
        height: null,
        formatCode: null,
        structureName: null,
        rate: screen.price,
        state: 'AVAILABLE',
        capacity: slot?.capacity ?? null,
        usedSpots: slot?.peakUsed ?? null,
        heldSpots: 0,
        freeSpots: null,
        holds: [],
        competitorConflict: false,
        inDeal: false,
      };
    });
  }

  private withState(item: InventoryItem): InventoryItem {
    if (item.kind === 'DIGITAL') {
      const free =
        item.capacity != null
          ? item.capacity - (item.usedSpots ?? 0) - (item.heldSpots ?? 0)
          : null;
      const state: InventoryState =
        free != null && free <= 0
          ? 'FULL'
          : item.holds.length > 0
            ? 'HELD'
            : 'AVAILABLE';
      return {
        ...item,
        freeSpots: free != null ? Math.max(0, free) : null,
        state,
      };
    }
    if (item.state === 'CONTRACTED') return item;
    if (item.holds.some((h) => h.status === 'BOOKED'))
      return { ...item, state: 'BOOKED' };
    if (item.holds.length > 0) return { ...item, state: 'HELD' };
    return item;
  }
}

function groupHolds(rows: ActiveHoldRow[]): Map<string, InventoryHold[]> {
  const grouped = new Map<string, ActiveHoldRow[]>();
  for (const row of rows) {
    const key =
      row.billboardId != null
        ? `STATIC:${row.billboardId}`
        : `DIGITAL:${row.digitalBillboardId}`;
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }

  const out = new Map<string, InventoryHold[]>();
  for (const [key, list] of grouped) {
    const ranked = [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'BOOKED' ? -1 : 1;
      return (
        (a.heldAt ?? a.createdAt).getTime() -
        (b.heldAt ?? b.createdAt).getTime()
      );
    });
    out.set(
      key,
      ranked.map((row, index) => ({
        siteId: row.id,
        dealId: row.dealId,
        dealTitle: row.deal.title,
        ownerName: fullName(row.deal.owner),
        status: row.status as 'HELD' | 'BOOKED',
        holdUntil: row.holdUntil?.toISOString() ?? null,
        rank: index + 1,
        brand: row.deal.brand,
        industry: row.deal.industry,
        spotsPerDay: row.spotsPerDay,
        startDate: isoDay(row.startDate)!,
        endDate: isoDay(row.endDate)!,
      })),
    );
  }
  return out;
}
