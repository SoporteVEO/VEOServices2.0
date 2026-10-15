import { Injectable, Logger } from '@nestjs/common';
import type { CrmMediaType, CrmSiteKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrmRenewalsService } from './crm-renewals.service.js';
import { HOLD_WARNING_DAYS, addDays } from './crm-ooh.constants.js';

export interface CrmOohDashboard {
  byMediaType: {
    mediaType: CrmMediaType | null;
    openCount: number;
    openValue: number;
  }[];
  holds: {
    active: number;
    expiringSoon: number;
    expired: number;
    items: {
      siteId: string;
      code: string;
      label: string;
      kind: CrmSiteKind;
      holdUntil: string;
      isExpired: boolean;
      dealId: string;
      dealTitle: string;
    }[];
  };
  /** Value of booked and held sites falling in each upcoming flight month. */
  flightForecast: { month: string; booked: number; held: number }[];
  renewals: {
    available: boolean;
    due: number;
    unmanaged: number;
    endingIn30: number;
  };
}

const FORECAST_MONTHS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CrmDashboardOohService {
  private readonly logger = new Logger(CrmDashboardOohService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly renewals: CrmRenewalsService,
  ) {}

  async overview(
    userId: string,
    scope: 'mine' | 'team',
  ): Promise<CrmOohDashboard> {
    const now = new Date();
    const owner = scope === 'mine' ? { ownerId: userId } : {};
    const forecastStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const forecastEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + FORECAST_MONTHS, 0),
    );

    const [mediaGroups, holdRows, flightSites, renewals] = await Promise.all([
      this.prisma.crmDeal.groupBy({
        by: ['mediaType'],
        where: { status: 'OPEN', ...owner },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.crmDealSite.findMany({
        where: {
          status: 'HELD',
          holdUntil: { gt: addDays(now, -7) },
          deal: { status: 'OPEN', ...owner },
        },
        orderBy: { holdUntil: 'asc' },
        select: {
          id: true,
          code: true,
          label: true,
          kind: true,
          holdUntil: true,
          deal: { select: { id: true, title: true } },
        },
      }),
      this.prisma.crmDealSite.findMany({
        where: {
          OR: [
            { status: 'BOOKED' },
            { status: 'HELD', holdUntil: { gt: now } },
          ],
          startDate: { lte: forecastEnd },
          endDate: { gte: forecastStart },
          deal: owner,
        },
        select: { status: true, rate: true, startDate: true, endDate: true },
      }),
      this.renewalSummary(userId, scope),
    ]);

    const warnAt = now.getTime() + HOLD_WARNING_DAYS * DAY_MS;
    const live = holdRows.filter((r) => r.holdUntil! > now);
    const expired = holdRows.filter((r) => r.holdUntil! <= now);
    const urgent = holdRows.filter((r) => r.holdUntil!.getTime() <= warnAt);

    return {
      byMediaType: mediaGroups
        .map((g) => ({
          mediaType: g.mediaType,
          openCount: g._count._all,
          openValue: g._sum.value ?? 0,
        }))
        .sort((a, b) => b.openValue - a.openValue),
      holds: {
        active: live.length,
        expiringSoon: live.filter((r) => r.holdUntil!.getTime() <= warnAt)
          .length,
        expired: expired.length,
        items: urgent.slice(0, 8).map((r) => ({
          siteId: r.id,
          code: r.code,
          label: r.label,
          kind: r.kind,
          holdUntil: r.holdUntil!.toISOString(),
          isExpired: r.holdUntil! <= now,
          dealId: r.deal.id,
          dealTitle: r.deal.title,
        })),
      },
      flightForecast: buildForecast(flightSites, forecastStart),
      renewals,
    };
  }

  private async renewalSummary(userId: string, scope: 'mine' | 'team') {
    try {
      const result = await this.renewals.list(
        { days: '60', scope },
        { id: userId },
      );
      return {
        available: true,
        due: result.summary.total,
        unmanaged: result.summary.unmanaged,
        endingIn30: result.summary.endingIn30,
      };
    } catch (error) {
      this.logger.warn(`Renewals unavailable for dashboard: ${String(error)}`);
      return { available: false, due: 0, unmanaged: 0, endingIn30: 0 };
    }
  }
}

function buildForecast(
  sites: { status: string; rate: number; startDate: Date; endDate: Date }[],
  start: Date,
) {
  return Array.from({ length: FORECAST_MONTHS }, (_, i) => {
    const monthStart = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1),
    );
    const monthEnd = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i + 1, 0),
    );
    let booked = 0;
    let held = 0;
    for (const site of sites) {
      const from = site.startDate > monthStart ? site.startDate : monthStart;
      const to = site.endDate < monthEnd ? site.endDate : monthEnd;
      if (from > to) continue;
      const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
      const value = (site.rate * days) / 30;
      if (site.status === 'BOOKED') booked += value;
      else held += value;
    }
    return {
      month: monthStart.toISOString().slice(0, 7),
      booked: Math.round(booked * 100) / 100,
      held: Math.round(held * 100) / 100,
    };
  });
}
