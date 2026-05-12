import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  HEARTBEAT_MAX_DELTA_MS,
  HEARTBEAT_MIN_INTERVAL_MS,
} from './user-metrics.constants.js';
import {
  addDaysUTC,
  getMonterreyMonthStart,
  getMonterreyWeekStart,
  isWithinBusinessHours,
  toMonterreyDateOnly,
} from './user-metrics.time.js';

export type HeartbeatRejectReason =
  | 'OUT_OF_HOURS'
  | 'RATE_LIMITED'
  | 'AFK_GAP';

export interface HeartbeatResult {
  counted: boolean;
  creditedMs: number;
  reason?: HeartbeatRejectReason;
  summary: UserMetricsSummary;
}

export interface UserMetricsSummary {
  todayMs: number;
  weekMs: number;
  monthMs: number;
  days: { date: string; activeMs: number }[];
}

const SUMMARY_DAYS_WINDOW = 30;

@Injectable()
export class UserMetricsService {
  private readonly logger = new Logger(UserMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async heartbeat(userId: string): Promise<HeartbeatResult> {
    const now = new Date();

    if (!isWithinBusinessHours(now)) {
      const summary = await this.getSummary(userId, now);
      return {
        counted: false,
        creditedMs: 0,
        reason: 'OUT_OF_HOURS',
        summary,
      };
    }

    const todayDate = toMonterreyDateOnly(now);
    const credited = await this.applyTick(userId, now, todayDate);
    const summary = await this.getSummary(userId, now);

    return {
      counted: credited.counted,
      creditedMs: credited.creditedMs,
      reason: credited.reason,
      summary,
    };
  }

  async getMySummary(userId: string): Promise<UserMetricsSummary> {
    return this.getSummary(userId, new Date());
  }

  private async applyTick(
    userId: string,
    now: Date,
    todayDate: Date,
  ): Promise<{
    counted: boolean;
    creditedMs: number;
    reason?: HeartbeatRejectReason;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        { last_tick_at: Date }[]
      >`SELECT last_tick_at FROM user_metrics WHERE user_id = ${userId} FOR UPDATE`;

      if (locked.length === 0) {
        await tx.userMetrics.create({
          data: { userId, lastTickAt: now },
        });
        return { counted: false, creditedMs: 0 };
      }

      const lastTickAt = locked[0]!.last_tick_at;
      const deltaMs = now.getTime() - lastTickAt.getTime();

      if (deltaMs < HEARTBEAT_MIN_INTERVAL_MS) {
        return {
          counted: false,
          creditedMs: 0,
          reason: 'RATE_LIMITED' as const,
        };
      }

      await tx.userMetrics.update({
        where: { userId },
        data: { lastTickAt: now },
      });

      if (deltaMs > HEARTBEAT_MAX_DELTA_MS) {
        return { counted: false, creditedMs: 0, reason: 'AFK_GAP' as const };
      }

      const creditedMs = deltaMs;

      await tx.userMetricsDay.upsert({
        where: { userId_date: { userId, date: todayDate } },
        create: { userId, date: todayDate, activeMs: creditedMs },
        update: { activeMs: { increment: creditedMs } },
      });

      return { counted: true, creditedMs };
    });
  }

  private async getSummary(
    userId: string,
    now: Date,
  ): Promise<UserMetricsSummary> {
    const todayDate = toMonterreyDateOnly(now);
    const weekStart = getMonterreyWeekStart(now);
    const monthStart = getMonterreyMonthStart(now);
    const windowStart = addDaysUTC(todayDate, -(SUMMARY_DAYS_WINDOW - 1));

    const rangeStart = new Date(
      Math.min(
        weekStart.getTime(),
        monthStart.getTime(),
        windowStart.getTime(),
      ),
    );

    const rows = await this.prisma.userMetricsDay.findMany({
      where: { userId, date: { gte: rangeStart, lte: todayDate } },
      select: { date: true, activeMs: true },
      orderBy: { date: 'asc' },
    });

    let todayMs = 0;
    let weekMs = 0;
    let monthMs = 0;
    const todayMs0 = todayDate.getTime();
    const weekMs0 = weekStart.getTime();
    const monthMs0 = monthStart.getTime();
    const windowMs0 = windowStart.getTime();

    const days: { date: string; activeMs: number }[] = [];
    for (const row of rows) {
      const rowTime = row.date.getTime();
      if (rowTime >= monthMs0) monthMs += row.activeMs;
      if (rowTime >= weekMs0) weekMs += row.activeMs;
      if (rowTime === todayMs0) todayMs += row.activeMs;
      if (rowTime >= windowMs0) {
        days.push({
          date: row.date.toISOString().slice(0, 10),
          activeMs: row.activeMs,
        });
      }
    }

    return { todayMs, weekMs, monthMs, days };
  }
}
