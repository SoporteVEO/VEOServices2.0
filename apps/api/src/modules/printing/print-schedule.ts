import {
  PrintJobKind,
  PrintJobStatus,
  PrintRescheduleStatus,
  type Prisma,
} from '@prisma/client';

const MINUTE_MS = 60 * 1000;

/** The production pass that currently holds (or held) the billboard's slot. */
export const ITEM_PRINT_JOB_ARGS = {
  where: {
    kind: PrintJobKind.PRODUCTION,
    status: {
      in: [
        PrintJobStatus.SCHEDULED,
        PrintJobStatus.SETUP,
        PrintJobStatus.PRINTING,
        PrintJobStatus.COOLDOWN,
        PrintJobStatus.COMPLETED,
      ],
    },
  },
  orderBy: [{ scheduledStartAt: 'desc' }, { id: 'desc' }],
  take: 1,
  select: {
    id: true,
    status: true,
    scheduledStartAt: true,
    setupMinutes: true,
    printMinutes: true,
    cooldownMinutes: true,
    printStartedAt: true,
    completedAt: true,
    machine: { select: { name: true } },
  },
} satisfies Prisma.ProductionOrderItem$printJobsArgs;

const PERSON_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.UserSelect;

export const RESCHEDULE_REQUEST_SELECT = {
  id: true,
  productionOrderItemId: true,
  status: true,
  isUrgent: true,
  preferredDate: true,
  reason: true,
  previousStartAt: true,
  resolutionNote: true,
  resolvedAt: true,
  createdAt: true,
  requestedBy: { select: PERSON_SELECT },
  resolvedBy: { select: PERSON_SELECT },
} satisfies Prisma.PrintRescheduleRequestSelect;

/** Latest request that was not withdrawn, so its outcome stays visible. */
export const ITEM_RESCHEDULE_REQUEST_ARGS = {
  where: { status: { not: PrintRescheduleStatus.CANCELLED } },
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: 1,
  select: RESCHEDULE_REQUEST_SELECT,
} satisfies Prisma.ProductionOrderItem$rescheduleRequestsArgs;

type ItemPrintJobRow = Prisma.PrintJobGetPayload<{
  select: typeof ITEM_PRINT_JOB_ARGS.select;
}>;

type RescheduleRequestRow = Prisma.PrintRescheduleRequestGetPayload<{
  select: typeof RESCHEDULE_REQUEST_SELECT;
}>;

export interface PersonSummaryDto {
  id: string;
  firstName: string;
  lastName: string | null;
}

export interface ItemPrintScheduleDto {
  jobId: string;
  status: PrintJobStatus;
  machineName: string;
  scheduledStartAt: string;
  /** When the press actually starts laying ink, after the set up. */
  printStartAt: string;
  scheduledEndAt: string;
  printMinutes: number;
  plannedTotalMinutes: number;
  printStartedAt: string | null;
  completedAt: string | null;
}

export interface PrintRescheduleRequestDto {
  id: string;
  productionOrderItemId: string;
  status: PrintRescheduleStatus;
  isUrgent: boolean;
  preferredDate: string | null;
  reason: string;
  previousStartAt: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  requestedBy: PersonSummaryDto;
  resolvedBy: PersonSummaryDto | null;
}

export function mapItemPrintSchedule(
  job: ItemPrintJobRow | undefined,
): ItemPrintScheduleDto | null {
  if (!job) return null;
  const start = job.scheduledStartAt.getTime();
  const plannedTotalMinutes =
    job.setupMinutes + job.printMinutes + job.cooldownMinutes;
  return {
    jobId: job.id,
    status: job.status,
    machineName: job.machine.name,
    scheduledStartAt: job.scheduledStartAt.toISOString(),
    printStartAt: new Date(start + job.setupMinutes * MINUTE_MS).toISOString(),
    scheduledEndAt: new Date(
      start + plannedTotalMinutes * MINUTE_MS,
    ).toISOString(),
    printMinutes: job.printMinutes,
    plannedTotalMinutes,
    printStartedAt: job.printStartedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

export function mapRescheduleRequest(
  row: RescheduleRequestRow,
): PrintRescheduleRequestDto {
  return {
    id: row.id,
    productionOrderItemId: row.productionOrderItemId,
    status: row.status,
    isUrgent: row.isUrgent,
    preferredDate: row.preferredDate?.toISOString() ?? null,
    reason: row.reason,
    previousStartAt: row.previousStartAt?.toISOString() ?? null,
    resolutionNote: row.resolutionNote,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    requestedBy: row.requestedBy,
    resolvedBy: row.resolvedBy,
  };
}
