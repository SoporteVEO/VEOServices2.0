import { Injectable } from '@nestjs/common';
import { MaintenanceJobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface MaintenanceStatusCount {
  status: MaintenanceJobStatus;
  count: number;
}

export interface MaintenanceCategoryStat {
  categoryId: string | null;
  name: string;
  color: string | null;
  total: number;
  completed: number;
  avgMinutesWorked: number | null;
}

export interface MaintenanceTechnicianStat {
  userId: string;
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  avgMinutesWorked: number | null;
  photosUploaded: number;
}

export interface MaintenanceOverview {
  totals: {
    all: number;
    overdue: number;
    photos: number;
    completionRate: number;
    avgMinutesToStart: number | null;
    avgMinutesWorked: number | null;
  };
  byStatus: MaintenanceStatusCount[];
  byCategory: MaintenanceCategoryStat[];
  byTechnician: MaintenanceTechnicianStat[];
  /** Completed jobs per calendar day, oldest first. */
  completionTrend: { date: string; completed: number }[];
}

const ALL_STATUSES: MaintenanceJobStatus[] = [
  MaintenanceJobStatus.PENDING,
  MaintenanceJobStatus.IN_PROGRESS,
  MaintenanceJobStatus.COMPLETED,
  MaintenanceJobStatus.CANCELLED,
];

function minutesBetween(from: Date | null, to: Date | null): number | null {
  if (!from || !to) return null;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / values.length);
}

/**
 * Aggregates the maintenance work orders for the module's overview. Reads the
 * job rows once and derives everything in memory: the table is small (one row
 * per work order) and this keeps every metric consistent with a single
 * snapshot.
 */
@Injectable()
export class MaintenanceStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(params: {
    from?: string;
    to?: string;
  }): Promise<MaintenanceOverview> {
    const where: Prisma.MaintenanceJobWhereInput = {};
    if (params.from || params.to) {
      where.scheduledAt = {
        ...(params.from ? { gte: new Date(params.from) } : {}),
        ...(params.to ? { lte: new Date(params.to) } : {}),
      };
    }

    const rows = await this.prisma.maintenanceJob.findMany({
      where,
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        completedAt: true,
        categoryId: true,
        category: { select: { name: true, color: true } },
        assignedUserId: true,
        assignedUser: { select: { firstName: true, lastName: true } },
        _count: { select: { photos: true } },
      },
    });

    const now = new Date();
    const isOpen = (status: MaintenanceJobStatus) =>
      status === MaintenanceJobStatus.PENDING ||
      status === MaintenanceJobStatus.IN_PROGRESS;

    const startDelays: number[] = [];
    const workDurations: number[] = [];
    let overdue = 0;
    let photos = 0;

    const statusCounts = new Map<MaintenanceJobStatus, number>(
      ALL_STATUSES.map((status) => [status, 0]),
    );
    const categories = new Map<
      string,
      MaintenanceCategoryStat & { durations: number[] }
    >();
    const technicians = new Map<
      string,
      MaintenanceTechnicianStat & { durations: number[] }
    >();
    const completionsByDay = new Map<string, number>();

    for (const row of rows) {
      statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
      photos += row._count.photos;

      const overdueRow =
        isOpen(row.status) && row.scheduledAt.getTime() < now.getTime();
      if (overdueRow) overdue += 1;

      const delay = minutesBetween(row.scheduledAt, row.startedAt);
      if (delay != null) startDelays.push(delay);

      const worked = minutesBetween(row.startedAt, row.completedAt);
      if (worked != null) workDurations.push(worked);

      const categoryKey = row.categoryId ?? '__none__';
      const category = categories.get(categoryKey) ?? {
        categoryId: row.categoryId,
        name: row.category?.name ?? 'Sin categoría',
        color: row.category?.color ?? null,
        total: 0,
        completed: 0,
        avgMinutesWorked: null,
        durations: [],
      };
      category.total += 1;
      if (row.status === MaintenanceJobStatus.COMPLETED)
        category.completed += 1;
      if (worked != null) category.durations.push(worked);
      categories.set(categoryKey, category);

      const technician = technicians.get(row.assignedUserId) ?? {
        userId: row.assignedUserId,
        name:
          [row.assignedUser.firstName, row.assignedUser.lastName]
            .filter(Boolean)
            .join(' ') || 'Sin nombre',
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        avgMinutesWorked: null,
        photosUploaded: 0,
        durations: [],
      };
      technician.total += 1;
      if (row.status === MaintenanceJobStatus.COMPLETED)
        technician.completed += 1;
      if (row.status === MaintenanceJobStatus.IN_PROGRESS) {
        technician.inProgress += 1;
      }
      if (overdueRow) technician.overdue += 1;
      technician.photosUploaded += row._count.photos;
      if (worked != null) technician.durations.push(worked);
      technicians.set(row.assignedUserId, technician);

      if (row.completedAt) {
        const day = row.completedAt.toISOString().slice(0, 10);
        completionsByDay.set(day, (completionsByDay.get(day) ?? 0) + 1);
      }
    }

    const completed = statusCounts.get(MaintenanceJobStatus.COMPLETED) ?? 0;
    const cancelled = statusCounts.get(MaintenanceJobStatus.CANCELLED) ?? 0;
    const decided = completed + cancelled;

    return {
      totals: {
        all: rows.length,
        overdue,
        photos,
        completionRate:
          decided === 0 ? 0 : Math.round((completed / decided) * 100),
        avgMinutesToStart: average(startDelays),
        avgMinutesWorked: average(workDurations),
      },
      byStatus: ALL_STATUSES.map((status) => ({
        status,
        count: statusCounts.get(status) ?? 0,
      })),
      byCategory: [...categories.values()]
        .map(({ durations, ...rest }) => ({
          ...rest,
          avgMinutesWorked: average(durations),
        }))
        .sort((a, b) => b.total - a.total),
      byTechnician: [...technicians.values()]
        .map(({ durations, ...rest }) => ({
          ...rest,
          avgMinutesWorked: average(durations),
        }))
        .sort((a, b) => b.total - a.total),
      completionTrend: [...completionsByDay.entries()]
        .map(([date, count]) => ({ date, completed: count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}
