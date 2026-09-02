import { Injectable } from '@nestjs/common';
import { PrintJobStatus, type Prisma } from '@prisma/client';
import { computeAreaM2 } from '../../printing/print-time.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** A start within this window of the plan still counts as punctual. */
const ON_TIME_TOLERANCE_MINUTES = 15;

const TOP_ORDERS_LIMIT = 15;
const TOP_CUSTOMERS_LIMIT = 15;
const MAX_JOBS = 20000;

export interface PrintingOverviewFilters {
  from: Date;
  /** Exclusive upper bound. */
  to: Date;
  machineId?: string | null;
  /** `getTimezoneOffset()` of the caller; day and hour buckets follow it. */
  tzOffsetMinutes?: number;
}

export interface PrintingTotals {
  jobs: number;
  scheduled: number;
  running: number;
  completed: number;
  cancelled: number;
  plannedHours: number;
  actualHours: number;
  plannedPrintHours: number;
  actualPrintHours: number;
  actualSetupHours: number;
  actualCooldownHours: number;
  avgSetupMinutes: number;
  avgPrintMinutes: number;
  avgCooldownMinutes: number;
  avgJobMinutes: number;
  avgStartDelayMinutes: number;
  onTimeStartRate: number;
  planAccuracy: number;
  utilization: number;
  squareMeters: number;
  minutesPerSquareMeter: number;
  activeMachines: number;
  availableHours: number;
}

export interface PrintingMachineRow {
  machineId: string;
  machineName: string;
  isActive: boolean;
  jobs: number;
  completed: number;
  cancelled: number;
  plannedHours: number;
  actualHours: number;
  actualSetupHours: number;
  actualPrintHours: number;
  actualCooldownHours: number;
  utilization: number;
  avgSetupMinutes: number;
  avgPrintMinutes: number;
  avgCooldownMinutes: number;
  avgStartDelayMinutes: number;
  onTimeStartRate: number;
  planAccuracy: number;
  squareMeters: number;
}

export interface PrintingDailyPoint {
  dateKey: string;
  jobs: number;
  completed: number;
  plannedHours: number;
  actualHours: number;
  setupHours: number;
  printHours: number;
  cooldownHours: number;
  squareMeters: number;
}

export interface PrintingSizeRow {
  sizeKey: string;
  width: number | null;
  height: number | null;
  jobs: number;
  completed: number;
  avgPlannedPrintMinutes: number;
  avgActualPrintMinutes: number;
  totalPrintHours: number;
  squareMeters: number;
}

export interface PrintingHourPoint {
  hour: number;
  jobsStarted: number;
  printHours: number;
}

export interface PrintingOrderRow {
  productionOrderId: string;
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  jobs: number;
  completed: number;
  plannedHours: number;
  actualHours: number;
  squareMeters: number;
}

export interface PrintingCustomerRow {
  customerName: string;
  customerCompany: string | null;
  jobs: number;
  actualHours: number;
  squareMeters: number;
}

export interface PrintingPhaseSplit {
  setupHours: number;
  printHours: number;
  cooldownHours: number;
}

export interface PrintingMachineOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PrintingOverview {
  range: { from: string; to: string };
  /** Every machine, unaffected by the filter, so the UI can offer the picker. */
  machines: PrintingMachineOption[];
  totals: PrintingTotals;
  phaseSplit: PrintingPhaseSplit;
  byMachine: PrintingMachineRow[];
  daily: PrintingDailyPoint[];
  bySize: PrintingSizeRow[];
  byHour: PrintingHourPoint[];
  topOrders: PrintingOrderRow[];
  topCustomers: PrintingCustomerRow[];
}

const JOB_SELECT = {
  id: true,
  machineId: true,
  status: true,
  scheduledStartAt: true,
  setupMinutes: true,
  printMinutes: true,
  cooldownMinutes: true,
  areaM2: true,
  setupStartedAt: true,
  printStartedAt: true,
  cooldownStartedAt: true,
  completedAt: true,
  productionOrderItem: {
    select: {
      productionOrderId: true,
      offerItem: {
        select: { width: true, height: true, quantity: true },
      },
      productionOrder: {
        select: {
          offer: {
            select: {
              offerNumber: true,
              customerName: true,
              customerCompany: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PrintJobSelect;

type JobRow = Prisma.PrintJobGetPayload<{ select: typeof JOB_SELECT }>;

/** Per-job derived figures, computed once and reused by every aggregation. */
interface JobMetrics {
  row: JobRow;
  plannedMinutes: number;
  actualSetupMinutes: number | null;
  actualPrintMinutes: number | null;
  actualCooldownMinutes: number | null;
  actualTotalMinutes: number | null;
  startDelayMinutes: number | null;
  squareMeters: number;
}

@Injectable()
export class PrintingAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates press activity for the window. Jobs are bucketed by their
   * scheduled start, which is the figure the shop plans against; actual
   * durations come from the phase timestamps stamped by the operator.
   */
  async getOverview(
    filters: PrintingOverviewFilters,
  ): Promise<PrintingOverview> {
    const { from, to, machineId } = filters;
    const tzOffsetMinutes = filters.tzOffsetMinutes ?? 0;

    const [allMachines, rows] = await Promise.all([
      this.prisma.printingMachine.findMany({
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, name: true, isActive: true },
      }),
      this.prisma.printJob.findMany({
        where: {
          scheduledStartAt: { gte: from, lt: to },
          ...(machineId ? { machineId } : {}),
        },
        take: MAX_JOBS,
        orderBy: { scheduledStartAt: 'asc' },
        select: JOB_SELECT,
      }),
    ]);

    const jobs = rows.map((row) => toJobMetrics(row));
    const scopedMachines = machineId
      ? allMachines.filter((machine) => machine.id === machineId)
      : allMachines;
    const activeMachines = scopedMachines.filter((m) => m.isActive).length;
    const rangeHours = Math.max((to.getTime() - from.getTime()) / HOUR_MS, 0);
    const availableHours = round2(rangeHours * Math.max(activeMachines, 1));

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      machines: allMachines,
      totals: this.buildTotals(jobs, activeMachines, availableHours),
      phaseSplit: this.buildPhaseSplit(jobs),
      byMachine: this.aggregateByMachine(jobs, scopedMachines, rangeHours),
      daily: this.aggregateDaily(jobs, from, to, tzOffsetMinutes),
      bySize: this.aggregateBySize(jobs),
      byHour: this.aggregateByHour(jobs, tzOffsetMinutes),
      topOrders: this.aggregateTopOrders(jobs),
      topCustomers: this.aggregateTopCustomers(jobs),
    };
  }

  private buildTotals(
    jobs: JobMetrics[],
    activeMachines: number,
    availableHours: number,
  ): PrintingTotals {
    const counts = countStatuses(jobs);
    const plannedMinutes = sum(jobs, (job) => job.plannedMinutes);
    const plannedPrintMinutes = sum(jobs, (job) => job.row.printMinutes);
    const actualMinutes = sum(jobs, (job) => job.actualTotalMinutes ?? 0);
    const actualPrintMinutes = sum(jobs, (job) => job.actualPrintMinutes ?? 0);
    const actualSetupMinutes = sum(jobs, (job) => job.actualSetupMinutes ?? 0);
    const actualCooldownMinutes = sum(
      jobs,
      (job) => job.actualCooldownMinutes ?? 0,
    );

    const completedJobs = jobs.filter(
      (job) => job.row.status === PrintJobStatus.COMPLETED,
    );
    const startedJobs = jobs.filter((job) => job.startDelayMinutes !== null);
    const onTime = startedJobs.filter(
      (job) => (job.startDelayMinutes ?? 0) <= ON_TIME_TOLERANCE_MINUTES,
    ).length;

    const squareMeters = sum(completedJobs, (job) => job.squareMeters);
    const plannedPrintOfCompleted = sum(
      completedJobs,
      (job) => job.row.printMinutes,
    );
    const actualPrintOfCompleted = sum(
      completedJobs,
      (job) => job.actualPrintMinutes ?? 0,
    );

    return {
      jobs: jobs.length,
      scheduled: counts.scheduled,
      running: counts.running,
      completed: counts.completed,
      cancelled: counts.cancelled,
      plannedHours: round2(plannedMinutes / 60),
      actualHours: round2(actualMinutes / 60),
      plannedPrintHours: round2(plannedPrintMinutes / 60),
      actualPrintHours: round2(actualPrintMinutes / 60),
      actualSetupHours: round2(actualSetupMinutes / 60),
      actualCooldownHours: round2(actualCooldownMinutes / 60),
      avgSetupMinutes: average(
        jobs.map((job) => job.actualSetupMinutes).filter(isNumber),
      ),
      avgPrintMinutes: average(
        jobs.map((job) => job.actualPrintMinutes).filter(isNumber),
      ),
      avgCooldownMinutes: average(
        jobs.map((job) => job.actualCooldownMinutes).filter(isNumber),
      ),
      avgJobMinutes: average(
        jobs.map((job) => job.actualTotalMinutes).filter(isNumber),
      ),
      avgStartDelayMinutes: average(
        startedJobs.map((job) => job.startDelayMinutes).filter(isNumber),
      ),
      onTimeStartRate: ratio(onTime, startedJobs.length),
      planAccuracy: ratio(plannedPrintOfCompleted, actualPrintOfCompleted),
      utilization: ratio(actualMinutes / 60, availableHours),
      squareMeters: round2(squareMeters),
      minutesPerSquareMeter:
        squareMeters > 0 ? round2(actualPrintOfCompleted / squareMeters) : 0,
      activeMachines,
      availableHours,
    };
  }

  private buildPhaseSplit(jobs: JobMetrics[]): PrintingPhaseSplit {
    return {
      setupHours: round2(sum(jobs, (j) => j.actualSetupMinutes ?? 0) / 60),
      printHours: round2(sum(jobs, (j) => j.actualPrintMinutes ?? 0) / 60),
      cooldownHours: round2(
        sum(jobs, (j) => j.actualCooldownMinutes ?? 0) / 60,
      ),
    };
  }

  private aggregateByMachine(
    jobs: JobMetrics[],
    machines: { id: string; name: string; isActive: boolean }[],
    rangeHours: number,
  ): PrintingMachineRow[] {
    return machines.map((machine) => {
      const own = jobs.filter((job) => job.row.machineId === machine.id);
      const counts = countStatuses(own);
      const actualMinutes = sum(own, (job) => job.actualTotalMinutes ?? 0);
      const startedJobs = own.filter((job) => job.startDelayMinutes !== null);
      const onTime = startedJobs.filter(
        (job) => (job.startDelayMinutes ?? 0) <= ON_TIME_TOLERANCE_MINUTES,
      ).length;
      const completed = own.filter(
        (job) => job.row.status === PrintJobStatus.COMPLETED,
      );

      return {
        machineId: machine.id,
        machineName: machine.name,
        isActive: machine.isActive,
        jobs: own.length,
        completed: counts.completed,
        cancelled: counts.cancelled,
        plannedHours: round2(sum(own, (job) => job.plannedMinutes) / 60),
        actualHours: round2(actualMinutes / 60),
        actualSetupHours: round2(
          sum(own, (job) => job.actualSetupMinutes ?? 0) / 60,
        ),
        actualPrintHours: round2(
          sum(own, (job) => job.actualPrintMinutes ?? 0) / 60,
        ),
        actualCooldownHours: round2(
          sum(own, (job) => job.actualCooldownMinutes ?? 0) / 60,
        ),
        utilization: ratio(actualMinutes / 60, rangeHours),
        avgSetupMinutes: average(
          own.map((job) => job.actualSetupMinutes).filter(isNumber),
        ),
        avgPrintMinutes: average(
          own.map((job) => job.actualPrintMinutes).filter(isNumber),
        ),
        avgCooldownMinutes: average(
          own.map((job) => job.actualCooldownMinutes).filter(isNumber),
        ),
        avgStartDelayMinutes: average(
          startedJobs.map((job) => job.startDelayMinutes).filter(isNumber),
        ),
        onTimeStartRate: ratio(onTime, startedJobs.length),
        planAccuracy: ratio(
          sum(completed, (job) => job.row.printMinutes),
          sum(completed, (job) => job.actualPrintMinutes ?? 0),
        ),
        squareMeters: round2(sum(completed, (job) => job.squareMeters)),
      };
    });
  }

  private aggregateDaily(
    jobs: JobMetrics[],
    from: Date,
    to: Date,
    tzOffsetMinutes: number,
  ): PrintingDailyPoint[] {
    const buckets = new Map<string, PrintingDailyPoint>();
    for (const dateKey of enumerateDayKeys(
      shiftToLocal(from, tzOffsetMinutes),
      shiftToLocal(to, tzOffsetMinutes),
    )) {
      buckets.set(dateKey, {
        dateKey,
        jobs: 0,
        completed: 0,
        plannedHours: 0,
        actualHours: 0,
        setupHours: 0,
        printHours: 0,
        cooldownHours: 0,
        squareMeters: 0,
      });
    }

    for (const job of jobs) {
      const key = toDayKey(
        shiftToLocal(job.row.scheduledStartAt, tzOffsetMinutes),
      );
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.jobs += 1;
      bucket.plannedHours += job.plannedMinutes / 60;
      bucket.actualHours += (job.actualTotalMinutes ?? 0) / 60;
      bucket.setupHours += (job.actualSetupMinutes ?? 0) / 60;
      bucket.printHours += (job.actualPrintMinutes ?? 0) / 60;
      bucket.cooldownHours += (job.actualCooldownMinutes ?? 0) / 60;
      if (job.row.status === PrintJobStatus.COMPLETED) {
        bucket.completed += 1;
        bucket.squareMeters += job.squareMeters;
      }
    }

    return [...buckets.values()].map((bucket) => ({
      ...bucket,
      plannedHours: round2(bucket.plannedHours),
      actualHours: round2(bucket.actualHours),
      setupHours: round2(bucket.setupHours),
      printHours: round2(bucket.printHours),
      cooldownHours: round2(bucket.cooldownHours),
      squareMeters: round2(bucket.squareMeters),
    }));
  }

  private aggregateBySize(jobs: JobMetrics[]): PrintingSizeRow[] {
    const buckets = new Map<
      string,
      {
        width: number | null;
        height: number | null;
        jobs: JobMetrics[];
      }
    >();

    for (const job of jobs) {
      const { width, height } = job.row.productionOrderItem.offerItem;
      const sizeKey =
        width != null && height != null
          ? `${formatMeters(width)} x ${formatMeters(height)}`
          : 'Sin medidas';
      const bucket = buckets.get(sizeKey);
      if (bucket) bucket.jobs.push(job);
      else buckets.set(sizeKey, { width, height, jobs: [job] });
    }

    return [...buckets.entries()]
      .map(([sizeKey, bucket]) => {
        const completed = bucket.jobs.filter(
          (job) => job.row.status === PrintJobStatus.COMPLETED,
        );
        return {
          sizeKey,
          width: bucket.width,
          height: bucket.height,
          jobs: bucket.jobs.length,
          completed: completed.length,
          avgPlannedPrintMinutes: average(
            bucket.jobs.map((job) => job.row.printMinutes),
          ),
          avgActualPrintMinutes: average(
            bucket.jobs.map((job) => job.actualPrintMinutes).filter(isNumber),
          ),
          totalPrintHours: round2(
            sum(bucket.jobs, (job) => job.actualPrintMinutes ?? 0) / 60,
          ),
          squareMeters: round2(sum(completed, (job) => job.squareMeters)),
        };
      })
      .sort((a, b) => b.jobs - a.jobs);
  }

  private aggregateByHour(
    jobs: JobMetrics[],
    tzOffsetMinutes: number,
  ): PrintingHourPoint[] {
    const points: PrintingHourPoint[] = Array.from(
      { length: 24 },
      (_, hour) => ({
        hour,
        jobsStarted: 0,
        printHours: 0,
      }),
    );

    for (const job of jobs) {
      const anchor = shiftToLocal(
        job.row.setupStartedAt ?? job.row.scheduledStartAt,
        tzOffsetMinutes,
      );
      const point = points[anchor.getUTCHours()];
      point.jobsStarted += 1;
      point.printHours += (job.actualPrintMinutes ?? job.row.printMinutes) / 60;
    }

    return points.map((point) => ({
      ...point,
      printHours: round2(point.printHours),
    }));
  }

  private aggregateTopOrders(jobs: JobMetrics[]): PrintingOrderRow[] {
    const buckets = new Map<string, JobMetrics[]>();
    for (const job of jobs) {
      const key = job.row.productionOrderItem.productionOrderId;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(job);
      else buckets.set(key, [job]);
    }

    return [...buckets.entries()]
      .map(([productionOrderId, own]) => {
        const offer = own[0].row.productionOrderItem.productionOrder.offer;
        const completed = own.filter(
          (job) => job.row.status === PrintJobStatus.COMPLETED,
        );
        return {
          productionOrderId,
          offerNumber: offer.offerNumber,
          customerName: offer.customerName,
          customerCompany: offer.customerCompany,
          jobs: own.length,
          completed: completed.length,
          plannedHours: round2(sum(own, (job) => job.plannedMinutes) / 60),
          actualHours: round2(
            sum(own, (job) => job.actualTotalMinutes ?? 0) / 60,
          ),
          squareMeters: round2(sum(completed, (job) => job.squareMeters)),
        };
      })
      .sort((a, b) => b.plannedHours - a.plannedHours)
      .slice(0, TOP_ORDERS_LIMIT);
  }

  private aggregateTopCustomers(jobs: JobMetrics[]): PrintingCustomerRow[] {
    const buckets = new Map<string, JobMetrics[]>();
    for (const job of jobs) {
      const offer = job.row.productionOrderItem.productionOrder.offer;
      const key = `${offer.customerCompany ?? ''}|${offer.customerName}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(job);
      else buckets.set(key, [job]);
    }

    return [...buckets.values()]
      .map((own) => {
        const offer = own[0].row.productionOrderItem.productionOrder.offer;
        const completed = own.filter(
          (job) => job.row.status === PrintJobStatus.COMPLETED,
        );
        return {
          customerName: offer.customerName,
          customerCompany: offer.customerCompany,
          jobs: own.length,
          actualHours: round2(
            sum(own, (job) => job.actualTotalMinutes ?? 0) / 60,
          ),
          squareMeters: round2(sum(completed, (job) => job.squareMeters)),
        };
      })
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, TOP_CUSTOMERS_LIMIT);
  }
}

function toJobMetrics(row: JobRow): JobMetrics {
  return {
    row,
    plannedMinutes: row.setupMinutes + row.printMinutes + row.cooldownMinutes,
    actualSetupMinutes: diffMinutes(row.setupStartedAt, row.printStartedAt),
    actualPrintMinutes: diffMinutes(
      row.printStartedAt,
      row.cooldownStartedAt ?? row.completedAt,
    ),
    actualCooldownMinutes: diffMinutes(row.cooldownStartedAt, row.completedAt),
    actualTotalMinutes: diffMinutes(row.setupStartedAt, row.completedAt),
    startDelayMinutes: diffMinutes(row.scheduledStartAt, row.setupStartedAt, {
      allowNegative: true,
    }),
    // The area frozen on the job is authoritative, since that is what the
    // press actually consumed. Jobs predating the column fall back to the
    // panel's current dimensions.
    squareMeters:
      row.areaM2 > 0
        ? row.areaM2
        : computeAreaM2(row.productionOrderItem.offerItem),
  };
}

function countStatuses(jobs: JobMetrics[]) {
  let scheduled = 0;
  let running = 0;
  let completed = 0;
  let cancelled = 0;
  for (const job of jobs) {
    switch (job.row.status) {
      case PrintJobStatus.SCHEDULED:
        scheduled += 1;
        break;
      case PrintJobStatus.SETUP:
      case PrintJobStatus.PRINTING:
      case PrintJobStatus.COOLDOWN:
        running += 1;
        break;
      case PrintJobStatus.COMPLETED:
        completed += 1;
        break;
      case PrintJobStatus.CANCELLED:
        cancelled += 1;
        break;
    }
  }
  return { scheduled, running, completed, cancelled };
}

function diffMinutes(
  from: Date | null,
  to: Date | null,
  options: { allowNegative?: boolean } = {},
): number | null {
  if (!from || !to) return null;
  const minutes = (to.getTime() - from.getTime()) / MINUTE_MS;
  if (!options.allowNegative && minutes < 0) return 0;
  return minutes;
}

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((acc, item) => acc + pick(item), 0);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round2(values.reduce((acc, value) => acc + value, 0) / values.length);
}

function ratio(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return round2((numerator / denominator) * 100);
}

function isNumber(value: number | null): value is number {
  return value !== null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatMeters(value: number): string {
  return Number.isInteger(value) ? String(value) : String(round2(value));
}

/**
 * Rebases an instant so the UTC getters on the result read as the caller's
 * local wall-clock time, letting day and hour buckets stay UTC-arithmetic.
 */
function shiftToLocal(date: Date, tzOffsetMinutes: number): Date {
  return new Date(date.getTime() - tzOffsetMinutes * MINUTE_MS);
}

function toDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function enumerateDayKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  // `to` is exclusive, so the last bucket is the day before it.
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() - 1),
  );
  while (cursor <= end) {
    keys.push(toDayKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}
