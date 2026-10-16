import { Injectable } from '@nestjs/common';
import { OfferEditReason, OfferEventType, type Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { OffersOverviewFilters } from './offers-analytics.service.js';

const RECENT_EDITS_LIMIT = 200;

export type OfferEditDirection = 'INCREASED' | 'DECREASED' | 'UNCHANGED';

export interface OfferEditsTotals {
  edits: number;
  offersEdited: number;
  increased: number;
  decreased: number;
  unchanged: number;
  netBillboards: number;
  amountDelta: number;
  withoutReason: number;
}

export interface OfferEditsByReasonRow {
  reason: OfferEditReason | null;
  edits: number;
  increased: number;
  decreased: number;
  unchanged: number;
  netBillboards: number;
  amountDelta: number;
}

export interface OfferEditRow {
  id: string;
  offerId: string;
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  reason: OfferEditReason | null;
  note: string | null;
  direction: OfferEditDirection;
  billboardsBefore: number;
  billboardsAfter: number;
  amountBefore: number | null;
  amountAfter: number | null;
  message: string;
  createdAt: string;
  actor: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  } | null;
}

export interface OfferEditsOverview {
  totals: OfferEditsTotals;
  byReason: OfferEditsByReasonRow[];
  recent: OfferEditRow[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function directionOf(before: number, after: number): OfferEditDirection {
  if (after > before) return 'INCREASED';
  if (after < before) return 'DECREASED';
  return 'UNCHANGED';
}

function emptyReasonRow(reason: OfferEditReason | null): OfferEditsByReasonRow {
  return {
    reason,
    edits: 0,
    increased: 0,
    decreased: 0,
    unchanged: 0,
    netBillboards: 0,
    amountDelta: 0,
  };
}

/**
 * Content edits of offers, framed around one question: why did sellers end up
 * quoting more or fewer billboards than they first offered.
 */
@Injectable()
export class OfferEditsAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(filters: OffersOverviewFilters): Promise<OfferEditsOverview> {
    const where: Prisma.OfferEventWhereInput = {
      type: { in: [OfferEventType.ITEMS_UPDATED, OfferEventType.UPDATED] },
      createdAt: { gte: filters.from, lt: filters.to },
      billboardsBefore: { not: null },
      billboardsAfter: { not: null },
      ...(filters.userId ? { actorUserId: filters.userId } : {}),
    };

    const rows = await this.prisma.offerEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        offerId: true,
        message: true,
        editReason: true,
        editReasonNote: true,
        billboardsBefore: true,
        billboardsAfter: true,
        amountBefore: true,
        amountAfter: true,
        createdAt: true,
        offer: {
          select: {
            offerNumber: true,
            customerName: true,
            customerCompany: true,
          },
        },
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const totals: OfferEditsTotals = {
      edits: 0,
      offersEdited: 0,
      increased: 0,
      decreased: 0,
      unchanged: 0,
      netBillboards: 0,
      amountDelta: 0,
      withoutReason: 0,
    };
    const byReason = new Map<OfferEditReason | null, OfferEditsByReasonRow>();
    const offerIds = new Set<string>();
    const recent: OfferEditRow[] = [];

    for (const row of rows) {
      const before = row.billboardsBefore ?? 0;
      const after = row.billboardsAfter ?? 0;
      const direction = directionOf(before, after);
      const delta = after - before;
      const amountDelta =
        row.amountBefore != null && row.amountAfter != null
          ? row.amountAfter - row.amountBefore
          : 0;

      const bucket = byReason.get(row.editReason) ?? emptyReasonRow(row.editReason);
      for (const target of [totals, bucket]) {
        target.edits += 1;
        target.netBillboards += delta;
        target.amountDelta = round2(target.amountDelta + amountDelta);
        if (direction === 'INCREASED') target.increased += 1;
        else if (direction === 'DECREASED') target.decreased += 1;
        else target.unchanged += 1;
      }
      byReason.set(row.editReason, bucket);

      offerIds.add(row.offerId);
      if (!row.editReason) totals.withoutReason += 1;

      if (recent.length < RECENT_EDITS_LIMIT) {
        recent.push({
          id: row.id,
          offerId: row.offerId,
          offerNumber: row.offer.offerNumber,
          customerName: row.offer.customerName,
          customerCompany: row.offer.customerCompany,
          reason: row.editReason,
          note: row.editReasonNote,
          direction,
          billboardsBefore: before,
          billboardsAfter: after,
          amountBefore: row.amountBefore,
          amountAfter: row.amountAfter,
          message: row.message,
          createdAt: row.createdAt.toISOString(),
          actor: row.actor,
        });
      }
    }

    totals.offersEdited = offerIds.size;

    return {
      totals,
      byReason: Array.from(byReason.values()).sort((a, b) => b.edits - a.edits),
      recent,
    };
  }
}
