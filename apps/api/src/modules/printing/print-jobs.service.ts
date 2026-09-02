import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PrintJobStatus,
  ProductionOrderStatus,
  type Prisma,
} from '@prisma/client';
import { BUSINESS_TZ, businessDayRange } from '../../lib/business-time.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { computeAreaM2, computePrintMinutes } from './print-time.js';
import { effectivePrintSpeed } from './printing-machines.service.js';

export type PrintJobAction =
  | 'START_SETUP'
  | 'START_PRINT'
  | 'START_COOLDOWN'
  | 'COMPLETE';

export interface PrintJobItemDto {
  id: string;
  productionOrderId: string;
  status: ProductionOrderStatus;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
}

export interface PrintJobOrderDto {
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
}

export interface PrintJobDto {
  id: string;
  machineId: string;
  machineName: string;
  status: PrintJobStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  setupMinutes: number;
  printMinutes: number;
  cooldownMinutes: number;
  plannedTotalMinutes: number;
  areaM2: number;
  setupStartedAt: string | null;
  printStartedAt: string | null;
  cooldownStartedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  actualSetupMinutes: number | null;
  actualPrintMinutes: number | null;
  actualCooldownMinutes: number | null;
  actualTotalMinutes: number | null;
  startDelayMinutes: number | null;
  notes: string | null;
  updatedAt: string;
  item: PrintJobItemDto;
  order: PrintJobOrderDto;
  createdBy: { id: string; firstName: string; lastName: string | null } | null;
}

export interface PrintBacklogItemDto {
  id: string;
  productionOrderId: string;
  status: ProductionOrderStatus;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  /**
   * Printed area of the panel. Print time is no longer a property of the
   * panel alone - it depends on the press it lands on - so the caller pairs
   * this with a machine's throughput to preview a duration.
   */
  areaM2: number;
  createdAt: string;
}

export interface SchedulePrintJobInput {
  productionOrderItemId: string;
  machineId: string;
  scheduledStartAt: string;
  setupMinutes?: number;
  printMinutes?: number;
  cooldownMinutes?: number;
  notes?: string | null;
}

export interface UpdatePrintJobInput {
  machineId?: string;
  scheduledStartAt?: string;
  setupMinutes?: number;
  printMinutes?: number;
  cooldownMinutes?: number;
  notes?: string | null;
}

/** Jobs in these states still occupy a slot on the press. */
const ACTIVE_STATUSES: PrintJobStatus[] = [
  PrintJobStatus.SCHEDULED,
  PrintJobStatus.SETUP,
  PrintJobStatus.PRINTING,
  PrintJobStatus.COOLDOWN,
];

/** Statuses that block re-scheduling the same billboard twice. */
const OCCUPYING_STATUSES: PrintJobStatus[] = [
  ...ACTIVE_STATUSES,
  PrintJobStatus.COMPLETED,
];

const MINUTE_MS = 60 * 1000;

/** Widen the overlap probe so neighbouring long jobs are always considered. */
const OVERLAP_PROBE_HOURS = 48;

const JOB_INCLUDE = {
  machine: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  productionOrderItem: {
    select: {
      id: true,
      status: true,
      productionOrderId: true,
      offerItem: {
        select: {
          billboardCode: true,
          address: true,
          cityName: true,
          departmentName: true,
          width: true,
          height: true,
          quantity: true,
        },
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
} satisfies Prisma.PrintJobInclude;

type PrintJobRow = Prisma.PrintJobGetPayload<{ include: typeof JOB_INCLUDE }>;

@Injectable()
export class PrintJobsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every job that overlaps the requested window. A job is included when it
   * starts before `to` and its planned end lands after `from`; since the end
   * is derived from three minute columns the tail filter happens in memory.
   */
  async listJobs(filters: {
    from: Date;
    to: Date;
    machineId?: string;
  }): Promise<PrintJobDto[]> {
    const probeFrom = new Date(
      filters.from.getTime() - OVERLAP_PROBE_HOURS * 60 * MINUTE_MS,
    );

    const rows = await this.prisma.printJob.findMany({
      where: {
        scheduledStartAt: { gte: probeFrom, lt: filters.to },
        ...(filters.machineId ? { machineId: filters.machineId } : {}),
      },
      orderBy: [{ scheduledStartAt: 'asc' }, { id: 'asc' }],
      include: JOB_INCLUDE,
    });

    return rows
      .map((row) => this.mapJob(row))
      .filter((job) => new Date(job.scheduledEndAt) > filters.from);
  }

  /**
   * Static billboards that are waiting for press time: not cancelled and
   * without a job that already occupies (or occupied) a slot.
   */
  async listBacklog(
    filters: { search?: string } = {},
  ): Promise<PrintBacklogItemDto[]> {
    const search = filters.search?.trim();

    const rows = await this.prisma.productionOrderItem.findMany({
      where: {
        status: { not: ProductionOrderStatus.CANCELLED },
        printJobs: { none: { status: { in: OCCUPYING_STATUSES } } },
        ...(search
          ? {
              OR: [
                {
                  offerItem: {
                    billboardCode: { contains: search, mode: 'insensitive' },
                  },
                },
                {
                  productionOrder: {
                    offer: {
                      OR: [
                        {
                          offerNumber: {
                            contains: search,
                            mode: 'insensitive',
                          },
                        },
                        {
                          customerName: {
                            contains: search,
                            mode: 'insensitive',
                          },
                        },
                        {
                          customerCompany: {
                            contains: search,
                            mode: 'insensitive',
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        status: true,
        productionOrderId: true,
        createdAt: true,
        offerItem: {
          select: {
            billboardCode: true,
            address: true,
            cityName: true,
            departmentName: true,
            width: true,
            height: true,
            quantity: true,
          },
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
    });

    return rows.map((row) => ({
      id: row.id,
      productionOrderId: row.productionOrderId,
      status: row.status,
      billboardCode: row.offerItem.billboardCode,
      address: row.offerItem.address,
      cityName: row.offerItem.cityName,
      departmentName: row.offerItem.departmentName,
      width: row.offerItem.width,
      height: row.offerItem.height,
      quantity: row.offerItem.quantity,
      offerNumber: row.productionOrder.offer.offerNumber,
      customerName: row.productionOrder.offer.customerName,
      customerCompany: row.productionOrder.offer.customerCompany,
      areaM2: computeAreaM2(row.offerItem),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async schedule(
    input: SchedulePrintJobInput,
    userId: string,
  ): Promise<PrintJobDto> {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: input.productionOrderItemId },
      select: {
        id: true,
        status: true,
        offerItem: {
          select: { width: true, height: true, quantity: true },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Valla de producción no encontrada');
    }
    if (item.status === ProductionOrderStatus.CANCELLED) {
      throw new BadRequestException('No se puede agendar una valla cancelada');
    }

    const alreadyScheduled = await this.prisma.printJob.findFirst({
      where: {
        productionOrderItemId: item.id,
        status: { in: OCCUPYING_STATUSES },
      },
      select: { id: true },
    });
    if (alreadyScheduled) {
      throw new BadRequestException(
        'Esta valla ya está agendada en el calendario de impresión',
      );
    }

    const machine = await this.findMachineOrThrow(input.machineId);
    const scheduledStartAt = parseDate(
      input.scheduledStartAt,
      'La fecha de inicio no es válida',
    );

    const areaM2 = computeAreaM2(item.offerItem);
    const setupMinutes = input.setupMinutes ?? machine.setupMinutes;
    const cooldownMinutes = input.cooldownMinutes ?? machine.cooldownMinutes;
    const printMinutes =
      input.printMinutes ??
      computePrintMinutes(
        areaM2,
        effectivePrintSpeed(machine.printSpeedM2PerHour),
      );

    assertMinutes({ setupMinutes, printMinutes, cooldownMinutes });

    await this.assertNoOverlap({
      machineId: machine.id,
      start: scheduledStartAt,
      totalMinutes: setupMinutes + printMinutes + cooldownMinutes,
    });
    await this.assertWithinDailyCapacity({
      machine,
      start: scheduledStartAt,
      areaM2,
    });

    const created = await this.prisma.printJob.create({
      data: {
        machineId: machine.id,
        productionOrderItemId: item.id,
        scheduledStartAt,
        setupMinutes,
        printMinutes,
        cooldownMinutes,
        areaM2,
        notes: input.notes?.trim() || null,
        createdByUserId: userId,
      },
      include: JOB_INCLUDE,
    });

    return this.mapJob(created);
  }

  async update(
    jobId: string,
    input: UpdatePrintJobInput,
  ): Promise<PrintJobDto> {
    const job = await this.prisma.printJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        machineId: true,
        status: true,
        scheduledStartAt: true,
        setupMinutes: true,
        printMinutes: true,
        cooldownMinutes: true,
        areaM2: true,
      },
    });
    if (!job) throw new NotFoundException('Trabajo de impresión no encontrado');
    if (job.status === PrintJobStatus.COMPLETED) {
      throw new BadRequestException(
        'No se puede reprogramar un trabajo finalizado',
      );
    }
    if (job.status === PrintJobStatus.CANCELLED) {
      throw new BadRequestException(
        'No se puede reprogramar un trabajo cancelado',
      );
    }

    const movedMachine = Boolean(
      input.machineId && input.machineId !== job.machineId,
    );
    const machine = await this.findMachineOrThrow(
      input.machineId ?? job.machineId,
    );

    const scheduledStartAt =
      input.scheduledStartAt !== undefined
        ? parseDate(input.scheduledStartAt, 'La fecha de inicio no es válida')
        : job.scheduledStartAt;

    const setupMinutes = input.setupMinutes ?? job.setupMinutes;
    const cooldownMinutes = input.cooldownMinutes ?? job.cooldownMinutes;
    // Duration is a property of the press, so a job that changes machines is
    // re-timed against the new throughput unless the caller states a time
    // (a resize, or a manual override in the job dialog).
    const printMinutes =
      input.printMinutes ??
      (movedMachine
        ? computePrintMinutes(
            job.areaM2,
            effectivePrintSpeed(machine.printSpeedM2PerHour),
          )
        : job.printMinutes);

    assertMinutes({ setupMinutes, printMinutes, cooldownMinutes });

    await this.assertNoOverlap({
      machineId: machine.id,
      start: scheduledStartAt,
      totalMinutes: setupMinutes + printMinutes + cooldownMinutes,
      ignoreJobId: job.id,
    });
    await this.assertWithinDailyCapacity({
      machine,
      start: scheduledStartAt,
      areaM2: job.areaM2,
      ignoreJobId: job.id,
    });

    const updated = await this.prisma.printJob.update({
      where: { id: job.id },
      data: {
        machineId: machine.id,
        scheduledStartAt,
        setupMinutes,
        printMinutes,
        cooldownMinutes,
        ...(input.notes !== undefined
          ? { notes: input.notes?.trim() || null }
          : {}),
      },
      include: JOB_INCLUDE,
    });

    return this.mapJob(updated);
  }

  /**
   * Advances a job through setup → printing → cooldown → completed, stamping
   * the real clock time at each hand-off. Skipping a phase back-fills its
   * start with the current time so a finished job always has a start anchor
   * and its actual duration for the skipped phase reads as zero.
   */
  async advance(jobId: string, action: PrintJobAction): Promise<PrintJobDto> {
    const job = await this.prisma.printJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        productionOrderItemId: true,
        setupStartedAt: true,
        printStartedAt: true,
        cooldownStartedAt: true,
      },
    });
    if (!job) throw new NotFoundException('Trabajo de impresión no encontrado');
    if (job.status === PrintJobStatus.CANCELLED) {
      throw new BadRequestException('El trabajo está cancelado');
    }
    if (job.status === PrintJobStatus.COMPLETED) {
      throw new BadRequestException('El trabajo ya está finalizado');
    }

    const now = new Date();
    const data: Prisma.PrintJobUpdateInput = {};

    switch (action) {
      case 'START_SETUP': {
        if (job.status !== PrintJobStatus.SCHEDULED) {
          throw new BadRequestException('El set up ya fue iniciado');
        }
        data.status = PrintJobStatus.SETUP;
        data.setupStartedAt = now;
        break;
      }
      case 'START_PRINT': {
        if (
          job.status !== PrintJobStatus.SCHEDULED &&
          job.status !== PrintJobStatus.SETUP
        ) {
          throw new BadRequestException('La impresión ya fue iniciada');
        }
        data.status = PrintJobStatus.PRINTING;
        data.printStartedAt = now;
        if (!job.setupStartedAt) data.setupStartedAt = now;
        break;
      }
      case 'START_COOLDOWN': {
        if (job.status !== PrintJobStatus.PRINTING) {
          throw new BadRequestException(
            'El cooldown solo puede iniciar durante la impresión',
          );
        }
        data.status = PrintJobStatus.COOLDOWN;
        data.cooldownStartedAt = now;
        break;
      }
      case 'COMPLETE': {
        if (
          job.status !== PrintJobStatus.PRINTING &&
          job.status !== PrintJobStatus.COOLDOWN
        ) {
          throw new BadRequestException(
            'Solo se puede finalizar un trabajo en impresión o cooldown',
          );
        }
        data.status = PrintJobStatus.COMPLETED;
        data.completedAt = now;
        if (!job.cooldownStartedAt) data.cooldownStartedAt = now;
        break;
      }
    }

    const updated = await this.prisma.printJob.update({
      where: { id: job.id },
      data,
      include: JOB_INCLUDE,
    });

    await this.syncItemStatus(job.productionOrderItemId);

    return this.mapJob(
      await this.prisma.printJob.findUniqueOrThrow({
        where: { id: updated.id },
        include: JOB_INCLUDE,
      }),
    );
  }

  async cancel(jobId: string): Promise<PrintJobDto> {
    const job = await this.prisma.printJob.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, productionOrderItemId: true },
    });
    if (!job) throw new NotFoundException('Trabajo de impresión no encontrado');
    if (job.status === PrintJobStatus.COMPLETED) {
      throw new BadRequestException(
        'No se puede cancelar un trabajo finalizado',
      );
    }

    const updated = await this.prisma.printJob.update({
      where: { id: job.id },
      data: { status: PrintJobStatus.CANCELLED, cancelledAt: new Date() },
      include: JOB_INCLUDE,
    });

    return this.mapJob(updated);
  }

  /** Removes a slot that was never started, freeing the billboard again. */
  async remove(jobId: string): Promise<void> {
    const job = await this.prisma.printJob.findUnique({
      where: { id: jobId },
      select: { id: true, status: true },
    });
    if (!job) throw new NotFoundException('Trabajo de impresión no encontrado');
    if (
      job.status !== PrintJobStatus.SCHEDULED &&
      job.status !== PrintJobStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Solo se pueden eliminar trabajos agendados o cancelados',
      );
    }
    await this.prisma.printJob.delete({ where: { id: job.id } });
  }

  /**
   * Keeps the production order item in step with the press: any started job
   * puts it in production, and it only reaches completed once no job for that
   * billboard is still pending.
   */
  private async syncItemStatus(itemId: string): Promise<void> {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        status: true,
        printJobs: { select: { status: true } },
      },
    });
    if (!item) return;
    if (item.status === ProductionOrderStatus.CANCELLED) return;

    const jobs = item.printJobs;
    const hasRunning = jobs.some(
      (job) =>
        job.status === PrintJobStatus.SETUP ||
        job.status === PrintJobStatus.PRINTING ||
        job.status === PrintJobStatus.COOLDOWN,
    );
    const hasPending = jobs.some(
      (job) => job.status === PrintJobStatus.SCHEDULED,
    );
    const hasCompleted = jobs.some(
      (job) => job.status === PrintJobStatus.COMPLETED,
    );

    let next: ProductionOrderStatus | null = null;
    if (hasRunning) {
      next = ProductionOrderStatus.IN_PRODUCTION;
    } else if (hasCompleted && !hasPending) {
      next = ProductionOrderStatus.COMPLETED;
    }

    if (next && next !== item.status) {
      await this.prisma.productionOrderItem.update({
        where: { id: item.id },
        data: { status: next },
      });
    }
  }

  private async findMachineOrThrow(machineId: string) {
    const machine = await this.prisma.printingMachine.findUnique({
      where: { id: machineId },
      select: {
        id: true,
        name: true,
        isActive: true,
        setupMinutes: true,
        cooldownMinutes: true,
        printSpeedM2PerHour: true,
        dailyCapacityM2: true,
      },
    });
    if (!machine) throw new NotFoundException('Máquina no encontrada');
    if (!machine.isActive) {
      throw new BadRequestException('La máquina está desactivada');
    }
    return machine;
  }

  /**
   * A press can only print so much area in a day. Everything that occupied the
   * machine that day counts - finished work included - because the limit is
   * about consumed capacity rather than what is still pending. The day is the
   * shop's calendar day, not the server's.
   */
  private async assertWithinDailyCapacity(params: {
    machine: { id: string; name: string; dailyCapacityM2: number };
    start: Date;
    areaM2: number;
    ignoreJobId?: string;
  }): Promise<void> {
    const limit = params.machine.dailyCapacityM2;
    if (!(limit > 0) || params.areaM2 <= 0) return;

    const day = businessDayRange(params.start);

    const { _sum } = await this.prisma.printJob.aggregate({
      _sum: { areaM2: true },
      where: {
        machineId: params.machine.id,
        status: { in: OCCUPYING_STATUSES },
        scheduledStartAt: { gte: day.start, lt: day.end },
        ...(params.ignoreJobId ? { id: { not: params.ignoreJobId } } : {}),
      },
    });

    const used = _sum.areaM2 ?? 0;
    // Float sums drift, and rejecting a job that fits exactly would be worse
    // than letting a square centimetre through.
    if (used + params.areaM2 <= limit + 0.01) return;

    throw new BadRequestException(
      `${params.machine.name} ya tiene ${formatArea(used)} m² programados para el ${formatDay(day.start)} y su capacidad diaria es ${formatArea(limit)} m². Este trabajo agrega ${formatArea(params.areaM2)} m², quedan ${formatArea(Math.max(0, limit - used))} m² disponibles.`,
    );
  }

  /**
   * A press can only run one panel at a time, so the new window must not
   * intersect any other live job. Candidates are narrowed by a generous time
   * probe and compared in memory because the end time is derived.
   */
  private async assertNoOverlap(params: {
    machineId: string;
    start: Date;
    totalMinutes: number;
    ignoreJobId?: string;
  }): Promise<void> {
    const end = new Date(
      params.start.getTime() + params.totalMinutes * MINUTE_MS,
    );
    const probeWindow = OVERLAP_PROBE_HOURS * 60 * MINUTE_MS;

    const neighbours = await this.prisma.printJob.findMany({
      where: {
        machineId: params.machineId,
        status: { in: ACTIVE_STATUSES },
        scheduledStartAt: {
          gte: new Date(params.start.getTime() - probeWindow),
          lte: new Date(end.getTime() + probeWindow),
        },
        ...(params.ignoreJobId ? { id: { not: params.ignoreJobId } } : {}),
      },
      select: {
        scheduledStartAt: true,
        setupMinutes: true,
        printMinutes: true,
        cooldownMinutes: true,
      },
    });

    const clash = neighbours.some((other) => {
      const otherStart = other.scheduledStartAt.getTime();
      const otherEnd =
        otherStart +
        (other.setupMinutes + other.printMinutes + other.cooldownMinutes) *
          MINUTE_MS;
      return otherStart < end.getTime() && params.start.getTime() < otherEnd;
    });

    if (clash) {
      throw new BadRequestException(
        'La máquina ya tiene un trabajo en ese horario',
      );
    }
  }

  private mapJob(row: PrintJobRow): PrintJobDto {
    const plannedTotalMinutes =
      row.setupMinutes + row.printMinutes + row.cooldownMinutes;

    return {
      id: row.id,
      machineId: row.machineId,
      machineName: row.machine.name,
      status: row.status,
      scheduledStartAt: row.scheduledStartAt.toISOString(),
      scheduledEndAt: new Date(
        row.scheduledStartAt.getTime() + plannedTotalMinutes * MINUTE_MS,
      ).toISOString(),
      setupMinutes: row.setupMinutes,
      printMinutes: row.printMinutes,
      cooldownMinutes: row.cooldownMinutes,
      plannedTotalMinutes,
      areaM2: row.areaM2,
      setupStartedAt: row.setupStartedAt?.toISOString() ?? null,
      printStartedAt: row.printStartedAt?.toISOString() ?? null,
      cooldownStartedAt: row.cooldownStartedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      actualSetupMinutes: diffMinutes(row.setupStartedAt, row.printStartedAt),
      actualPrintMinutes: diffMinutes(
        row.printStartedAt,
        row.cooldownStartedAt ?? row.completedAt,
      ),
      actualCooldownMinutes: diffMinutes(
        row.cooldownStartedAt,
        row.completedAt,
      ),
      actualTotalMinutes: diffMinutes(row.setupStartedAt, row.completedAt),
      startDelayMinutes: diffMinutes(row.scheduledStartAt, row.setupStartedAt, {
        allowNegative: true,
      }),
      notes: row.notes,
      updatedAt: row.updatedAt.toISOString(),
      item: {
        id: row.productionOrderItem.id,
        productionOrderId: row.productionOrderItem.productionOrderId,
        status: row.productionOrderItem.status,
        billboardCode: row.productionOrderItem.offerItem.billboardCode,
        address: row.productionOrderItem.offerItem.address,
        cityName: row.productionOrderItem.offerItem.cityName,
        departmentName: row.productionOrderItem.offerItem.departmentName,
        width: row.productionOrderItem.offerItem.width,
        height: row.productionOrderItem.offerItem.height,
        quantity: row.productionOrderItem.offerItem.quantity,
      },
      order: {
        offerNumber: row.productionOrderItem.productionOrder.offer.offerNumber,
        customerName:
          row.productionOrderItem.productionOrder.offer.customerName,
        customerCompany:
          row.productionOrderItem.productionOrder.offer.customerCompany,
      },
      createdBy: row.createdBy,
    };
  }
}

function diffMinutes(
  from: Date | null,
  to: Date | null,
  options: { allowNegative?: boolean } = {},
): number | null {
  if (!from || !to) return null;
  const minutes = (to.getTime() - from.getTime()) / MINUTE_MS;
  if (!options.allowNegative && minutes < 0) return 0;
  return Math.round(minutes * 100) / 100;
}

function formatArea(value: number): string {
  return String(Math.round(value * 100) / 100);
}

const DAY_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  timeZone: BUSINESS_TZ,
  day: 'numeric',
  month: 'short',
});

function formatDay(value: Date): string {
  return DAY_FORMATTER.format(value);
}

function parseDate(value: string, message: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new BadRequestException(message);
  return parsed;
}

function assertMinutes(input: {
  setupMinutes: number;
  printMinutes: number;
  cooldownMinutes: number;
}): void {
  if (input.printMinutes < 1) {
    throw new BadRequestException(
      'El tiempo de impresión debe ser de al menos 1 minuto',
    );
  }
  if (input.setupMinutes < 0 || input.cooldownMinutes < 0) {
    throw new BadRequestException(
      'Los tiempos de set up y cooldown no pueden ser negativos',
    );
  }
  if (
    input.setupMinutes + input.printMinutes + input.cooldownMinutes >
    24 * 60
  ) {
    throw new BadRequestException('Un trabajo no puede durar más de 24 horas');
  }
}
