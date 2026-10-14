import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PantallasPlacementService } from './pantallas-placement.service.js';
import {
  fromIsoDate,
  localIsoDate,
  screenCapacity,
  toIsoDate,
} from './pantallas-rules.js';

export interface ScreenAvailability {
  capacity: number;
  peakUsed: number;
}

interface Interval {
  start: string | null;
  end: string | null;
  spots: number;
}

/**
 * Daily availability of every screen over a date range: its operating
 * capacity minus the busiest day of committed spots (campaigns that are not
 * paused plus completed shop purchases).
 */
@Injectable()
export class PantallasCapacityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly placement: PantallasPlacementService,
  ) {}

  async availabilityInRange(
    from: Date,
    to: Date,
  ): Promise<Map<string, ScreenAvailability>> {
    const fromIso = localIsoDate(from);
    const toIso = localIsoDate(to);
    const fromDate = fromIsoDate(fromIso)!;
    const toDate = fromIsoDate(toIso)!;

    const [settings, screens, campaigns, purchases] = await Promise.all([
      this.placement.loadSettings(this.prisma),
      this.prisma.digitalBillboard.findMany({
        select: { id: true, turnOnAt: true, turnOffAt: true },
      }),
      this.prisma.digitalBillboardCampaign.findMany({
        where: {
          paused: false,
          NOT: { startDate: null, endDate: null },
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: toDate } }] },
            { OR: [{ endDate: null }, { endDate: { gte: fromDate } }] },
          ],
        },
        select: {
          startDate: true,
          endDate: true,
          spotsPerDay: true,
          sublist: { select: { digitalBillboardId: true } },
        },
      }),
      this.prisma.purchaseItem.findMany({
        where: {
          digitalBillboardId: { not: null },
          spotCount: { not: null },
          purchase: { status: 'COMPLETED' },
          AND: [{ from: { lte: to } }, { to: { gte: from } }],
        },
        select: { digitalBillboardId: true, spotCount: true, from: true, to: true },
      }),
    ]);

    const intervals = new Map<string, Interval[]>();
    const push = (screenId: string, interval: Interval) => {
      const list = intervals.get(screenId) ?? [];
      list.push(interval);
      intervals.set(screenId, list);
    };
    for (const c of campaigns) {
      push(c.sublist.digitalBillboardId, {
        start: toIsoDate(c.startDate),
        end: toIsoDate(c.endDate),
        spots: c.spotsPerDay,
      });
    }
    for (const p of purchases) {
      if (!p.digitalBillboardId || p.spotCount == null) continue;
      push(p.digitalBillboardId, {
        start: localIsoDate(p.from),
        end: localIsoDate(p.to),
        spots: p.spotCount,
      });
    }

    const out = new Map<string, ScreenAvailability>();
    for (const screen of screens) {
      out.set(screen.id, {
        capacity: screenCapacity(screen, settings.spotsPerHour),
        peakUsed: peakDailySpots(intervals.get(screen.id) ?? [], fromIso, toIso),
      });
    }
    return out;
  }
}

/** The daily total only changes where an interval starts, so those are the days to check. */
function peakDailySpots(intervals: Interval[], fromIso: string, toIso: string) {
  const days = new Set<string>([fromIso]);
  for (const i of intervals) {
    if (i.start && i.start > fromIso && i.start <= toIso) days.add(i.start);
  }
  let peak = 0;
  for (const day of days) {
    const total = intervals.reduce(
      (sum, i) =>
        (!i.start || i.start <= day) && (!i.end || i.end >= day)
          ? sum + i.spots
          : sum,
      0,
    );
    peak = Math.max(peak, total);
  }
  return peak;
}
