import { Injectable } from '@nestjs/common';
import type {
  CrmActivityType,
  CrmDealSource,
  CrmStageKind,
  OfferStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CrmDashboardOohService,
  type CrmOohDashboard,
} from './crm-dashboard-ooh.service.js';
import {
  OFFER_SUMMARY_SELECT,
  serializeOffer,
  type CrmOfferSummary,
} from './crm-deals.service.js';
import { CrmPipelinesService } from './crm-pipelines.service.js';
import {
  addMonths,
  endOfTodaySv,
  monthKeySv,
  startOfMonthSv,
} from './crm-time.js';
import {
  CRM_SUB_ROLE,
  DEFAULT_STALE_DAYS,
  USER_SUMMARY_SELECT,
  type CrmUserSummary,
} from './crm.constants.js';

export type DashboardScope = 'mine' | 'team';

export interface DashboardDealLite {
  id: string;
  title: string;
  value: number;
  stageName: string;
  stageColor: string | null;
  clientName: string | null;
  ownerName: string;
  expectedCloseDate: string | null;
  lastActivityAt: string;
}

export interface CrmDashboard {
  scope: DashboardScope;
  period: { from: string; to: string };
  totals: {
    openDeals: number;
    openValue: number;
    weightedValue: number;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    winRate: number;
    avgDealSize: number;
    avgCycleDays: number;
    newDeals: number;
    emailsSent: number;
    whatsappSent: number;
    activities: number;
    overdueTasks: number;
    todayTasks: number;
  };
  pipeline: {
    id: string;
    name: string;
    stages: {
      id: string;
      name: string;
      color: string | null;
      kind: CrmStageKind;
      count: number;
      value: number;
    }[];
  };
  trend: {
    month: string;
    wonValue: number;
    wonCount: number;
    lostCount: number;
    newDeals: number;
  }[];
  bySource: { source: CrmDealSource | null; count: number; value: number }[];
  activityByType: { type: CrmActivityType; count: number }[];
  offers: {
    byStatus: { status: OfferStatus; count: number; total: number }[];
    unlinked: CrmOfferSummary[];
    unlinkedCount: number;
  };
  upcomingTasks: {
    id: string;
    title: string;
    dueAt: string;
    dealTitle: string | null;
    isOverdue: boolean;
  }[];
  topDeals: DashboardDealLite[];
  staleDeals: DashboardDealLite[];
  leaderboard: {
    user: CrmUserSummary;
    wonValue: number;
    wonCount: number;
    openValue: number;
    openCount: number;
  }[];
  ooh: CrmOohDashboard;
}

const TREND_MONTHS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

const DEAL_LITE_SELECT = {
  id: true,
  title: true,
  value: true,
  expectedCloseDate: true,
  lastActivityAt: true,
  stage: { select: { name: true, color: true, rottingDays: true } },
  client: { select: { name: true, company: true } },
  owner: { select: { firstName: true, lastName: true } },
} as const satisfies Prisma.CrmDealSelect;

type DealLiteRow = Prisma.CrmDealGetPayload<{
  select: typeof DEAL_LITE_SELECT;
}>;

function toLite(row: DealLiteRow): DashboardDealLite {
  return {
    id: row.id,
    title: row.title,
    value: row.value,
    stageName: row.stage.name,
    stageColor: row.stage.color,
    clientName: row.client?.company || row.client?.name || null,
    ownerName: [row.owner.firstName, row.owner.lastName]
      .filter(Boolean)
      .join(' '),
    expectedCloseDate: row.expectedCloseDate?.toISOString() ?? null,
    lastActivityAt: row.lastActivityAt.toISOString(),
  };
}

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

@Injectable()
export class CrmDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelines: CrmPipelinesService,
    private readonly ooh: CrmDashboardOohService,
  ) {}

  async overview(
    userId: string,
    params: { scope?: string; pipelineId?: string; from?: string; to?: string },
  ): Promise<CrmDashboard> {
    const scope: DashboardScope = params.scope === 'team' ? 'team' : 'mine';
    const now = new Date();
    const from = parseDate(params.from, startOfMonthSv(now));
    const to = parseDate(params.to, endOfTodaySv(now));
    const owner = scope === 'mine' ? { ownerId: userId } : {};
    const actor = scope === 'mine' ? { actorId: userId } : {};
    const sender = scope === 'mine' ? { userId } : {};
    const offerOwner = scope === 'mine' ? { createdByUserId: userId } : {};
    const inPeriod = { gte: from, lte: to };

    const pipelineId = await this.pipelines.resolvePipelineId(
      params.pipelineId,
    );
    const trendStart = addMonths(startOfMonthSv(now), -(TREND_MONTHS - 1));

    const [
      pipeline,
      openByStage,
      wonInPeriod,
      lostCount,
      newDeals,
      emailsSent,
      whatsappSent,
      activityGroups,
      overdueTasks,
      todayTasks,
      wonTrend,
      lostTrend,
      createdTrend,
      sourceGroups,
      offerGroups,
      unlinkedOffers,
      unlinkedCount,
      upcomingTasks,
      topDeals,
      staleCandidates,
      ooh,
    ] = await Promise.all([
      this.pipelines.get(pipelineId),
      this.prisma.crmDeal.groupBy({
        by: ['stageId'],
        where: { status: 'OPEN', ...owner },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.crmDeal.findMany({
        where: { status: 'WON', wonAt: inPeriod, ...owner },
        select: { value: true, createdAt: true, wonAt: true },
      }),
      this.prisma.crmDeal.count({
        where: { status: 'LOST', lostAt: inPeriod, ...owner },
      }),
      this.prisma.crmDeal.count({ where: { createdAt: inPeriod, ...owner } }),
      this.prisma.crmMessage.count({
        where: {
          channel: 'EMAIL',
          direction: 'OUTBOUND',
          status: { not: 'FAILED' },
          sentAt: inPeriod,
          ...sender,
        },
      }),
      this.prisma.crmMessage.count({
        where: {
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          status: { not: 'FAILED' },
          sentAt: inPeriod,
          ...sender,
        },
      }),
      this.prisma.crmActivity.groupBy({
        by: ['type'],
        where: { occurredAt: inPeriod, ...actor },
        _count: { _all: true },
      }),
      this.prisma.crmTask.count({
        where: { assigneeId: userId, completedAt: null, dueAt: { lt: now } },
      }),
      this.prisma.crmTask.count({
        where: {
          assigneeId: userId,
          completedAt: null,
          dueAt: { gte: now, lt: endOfTodaySv(now) },
        },
      }),
      this.prisma.crmDeal.findMany({
        where: { status: 'WON', wonAt: { gte: trendStart }, ...owner },
        select: { wonAt: true, value: true },
      }),
      this.prisma.crmDeal.findMany({
        where: { status: 'LOST', lostAt: { gte: trendStart }, ...owner },
        select: { lostAt: true },
      }),
      this.prisma.crmDeal.findMany({
        where: { createdAt: { gte: trendStart }, ...owner },
        select: { createdAt: true },
      }),
      this.prisma.crmDeal.groupBy({
        by: ['source'],
        where: { createdAt: inPeriod, ...owner },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.offerCreated.groupBy({
        by: ['status'],
        where: { createdAt: inPeriod, ...offerOwner },
        _count: { _all: true },
        _sum: { totalImpression: true, totalRental: true },
      }),
      this.prisma.offerCreated.findMany({
        where: {
          crmDealLink: null,
          status: { in: ['PENDING', 'ACCEPTED'] },
          ...offerOwner,
        },
        select: OFFER_SUMMARY_SELECT,
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.offerCreated.count({
        where: {
          crmDealLink: null,
          status: { in: ['PENDING', 'ACCEPTED'] },
          ...offerOwner,
        },
      }),
      this.prisma.crmTask.findMany({
        where: { assigneeId: userId, completedAt: null },
        orderBy: { dueAt: 'asc' },
        take: 6,
        select: {
          id: true,
          title: true,
          dueAt: true,
          deal: { select: { title: true } },
        },
      }),
      this.prisma.crmDeal.findMany({
        where: { status: 'OPEN', ...owner },
        orderBy: { value: 'desc' },
        take: 5,
        select: DEAL_LITE_SELECT,
      }),
      this.prisma.crmDeal.findMany({
        where: {
          status: 'OPEN',
          lastActivityAt: { lt: new Date(now.getTime() - 3 * DAY_MS) },
          ...owner,
        },
        orderBy: { lastActivityAt: 'asc' },
        take: 40,
        select: DEAL_LITE_SELECT,
      }),
      this.ooh.overview(userId, scope),
    ]);

    const stageMeta = await this.prisma.crmStage.findMany({
      where: { id: { in: openByStage.map((g) => g.stageId) } },
      select: { id: true, probability: true },
    });
    const probability = new Map(stageMeta.map((s) => [s.id, s.probability]));
    const openDeals = openByStage.reduce((acc, g) => acc + g._count._all, 0);
    const openValue = openByStage.reduce(
      (acc, g) => acc + (g._sum.value ?? 0),
      0,
    );
    const weightedValue = openByStage.reduce(
      (acc, g) =>
        acc + ((g._sum.value ?? 0) * (probability.get(g.stageId) ?? 0)) / 100,
      0,
    );
    const byStage = new Map(openByStage.map((g) => [g.stageId, g]));

    const wonValue = wonInPeriod.reduce((acc, d) => acc + d.value, 0);
    const wonCount = wonInPeriod.length;
    const cycleDays = wonInPeriod
      .filter((d) => d.wonAt)
      .map((d) => (d.wonAt!.getTime() - d.createdAt.getTime()) / DAY_MS);

    const trend = Array.from({ length: TREND_MONTHS }, (_, i) => ({
      month: monthKeySv(addMonths(trendStart, i)),
      wonValue: 0,
      wonCount: 0,
      lostCount: 0,
      newDeals: 0,
    }));
    const trendIndex = new Map(trend.map((t, i) => [t.month, i]));
    const bump = (
      date: Date | null,
      apply: (t: (typeof trend)[number]) => void,
    ) => {
      const index = date ? trendIndex.get(monthKeySv(date)) : undefined;
      if (index !== undefined) apply(trend[index]);
    };
    for (const d of wonTrend)
      bump(d.wonAt, (t) => {
        t.wonValue += d.value;
        t.wonCount += 1;
      });
    for (const d of lostTrend)
      bump(d.lostAt, (t) => {
        t.lostCount += 1;
      });
    for (const d of createdTrend)
      bump(d.createdAt, (t) => {
        t.newDeals += 1;
      });

    const staleDeals = staleCandidates
      .filter((d) => {
        const days = d.stage.rottingDays ?? DEFAULT_STALE_DAYS;
        return now.getTime() - d.lastActivityAt.getTime() > days * DAY_MS;
      })
      .slice(0, 5)
      .map(toLite);

    return {
      scope,
      period: { from: from.toISOString(), to: to.toISOString() },
      totals: {
        openDeals,
        openValue,
        weightedValue,
        wonCount,
        wonValue,
        lostCount,
        winRate:
          wonCount + lostCount === 0
            ? 0
            : Math.round((wonCount / (wonCount + lostCount)) * 100),
        avgDealSize: wonCount === 0 ? 0 : wonValue / wonCount,
        avgCycleDays: cycleDays.length
          ? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length)
          : 0,
        newDeals,
        emailsSent,
        whatsappSent,
        activities: activityGroups.reduce((acc, g) => acc + g._count._all, 0),
        overdueTasks,
        todayTasks,
      },
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
        stages: pipeline.stages
          .filter((s) => s.kind === 'OPEN')
          .map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            kind: s.kind,
            count: byStage.get(s.id)?._count._all ?? 0,
            value: byStage.get(s.id)?._sum.value ?? 0,
          })),
      },
      trend,
      bySource: sourceGroups
        .map((g) => ({
          source: g.source,
          count: g._count._all,
          value: g._sum.value ?? 0,
        }))
        .sort((a, b) => b.count - a.count),
      activityByType: activityGroups
        .map((g) => ({ type: g.type, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      offers: {
        byStatus: offerGroups.map((g) => ({
          status: g.status,
          count: g._count._all,
          total: (g._sum.totalImpression ?? 0) + (g._sum.totalRental ?? 0),
        })),
        unlinked: unlinkedOffers.map(serializeOffer),
        unlinkedCount,
      },
      upcomingTasks: upcomingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueAt: t.dueAt.toISOString(),
        dealTitle: t.deal?.title ?? null,
        isOverdue: t.dueAt.getTime() < now.getTime(),
      })),
      topDeals: topDeals.map(toLite),
      staleDeals,
      leaderboard: scope === 'team' ? await this.leaderboard(inPeriod) : [],
      ooh,
    };
  }

  async team(): Promise<CrmUserSummary[]> {
    return this.prisma.user.findMany({
      where: { disabled: false, subRoles: { has: CRM_SUB_ROLE } },
      select: USER_SUMMARY_SELECT,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  private async leaderboard(inPeriod: { gte: Date; lte: Date }) {
    const [users, won, open] = await Promise.all([
      this.team(),
      this.prisma.crmDeal.groupBy({
        by: ['ownerId'],
        where: { status: 'WON', wonAt: inPeriod },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.crmDeal.groupBy({
        by: ['ownerId'],
        where: { status: 'OPEN' },
        _count: { _all: true },
        _sum: { value: true },
      }),
    ]);
    const wonBy = new Map(won.map((g) => [g.ownerId, g]));
    const openBy = new Map(open.map((g) => [g.ownerId, g]));
    return users
      .map((user) => ({
        user,
        wonValue: wonBy.get(user.id)?._sum.value ?? 0,
        wonCount: wonBy.get(user.id)?._count._all ?? 0,
        openValue: openBy.get(user.id)?._sum.value ?? 0,
        openCount: openBy.get(user.id)?._count._all ?? 0,
      }))
      .sort((a, b) => b.wonValue - a.wonValue || b.openValue - a.openValue);
  }
}
