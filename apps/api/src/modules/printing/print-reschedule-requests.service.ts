import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  PrintJobStatus,
  PrintRescheduleStatus,
  ProductionOrderStatus,
  type Prisma,
} from '@prisma/client';
import { BUSINESS_TZ } from '../../lib/business-time.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ITEM_PRINT_JOB_ARGS,
  RESCHEDULE_REQUEST_SELECT,
  mapItemPrintSchedule,
  mapRescheduleRequest,
  type ItemPrintScheduleDto,
  type PrintRescheduleRequestDto,
} from './print-schedule.js';

export interface CreatePrintRescheduleRequestInput {
  productionOrderItemId: string;
  reason: string;
  isUrgent?: boolean;
  preferredDate?: string;
}

export interface ResolvePrintRescheduleRequestInput {
  status: 'RESOLVED' | 'REJECTED';
  resolutionNote?: string;
}

/** A pending request as production sees it, with the billboard it is about. */
export interface PrintRescheduleQueueItemDto extends PrintRescheduleRequestDto {
  productionOrderId: string;
  orderNumber: string;
  customerName: string;
  customerCompany: string | null;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  width: number | null;
  height: number | null;
  printSchedule: ItemPrintScheduleDto | null;
}

const QUEUE_SELECT = {
  ...RESCHEDULE_REQUEST_SELECT,
  productionOrderItem: {
    select: {
      productionOrderId: true,
      billboardCode: true,
      address: true,
      cityName: true,
      width: true,
      height: true,
      printJobs: ITEM_PRINT_JOB_ARGS,
      productionOrder: {
        select: { orderNumber: true, customerName: true, customerCompany: true },
      },
    },
  },
} satisfies Prisma.PrintRescheduleRequestSelect;

type QueueRow = Prisma.PrintRescheduleRequestGetPayload<{
  select: typeof QUEUE_SELECT;
}>;

const PRODUCTION_HREF = '/dashboard/production?tab=solicitudes';
const MY_ORDERS_HREF = '/dashboard/my-space/production-orders';

const DAY_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  timeZone: BUSINESS_TZ,
  day: 'numeric',
  month: 'short',
});

@Injectable()
export class PrintRescheduleRequestsService {
  private readonly logger = new Logger(PrintRescheduleRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listPending(): Promise<PrintRescheduleQueueItemDto[]> {
    const rows = await this.prisma.printRescheduleRequest.findMany({
      where: { status: PrintRescheduleStatus.PENDING },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: QUEUE_SELECT,
    });
    return rows.map(mapQueueItem);
  }

  /** Only the owner of the order (its salesperson) may ask for a change. */
  async create(
    userId: string,
    input: CreatePrintRescheduleRequestInput,
  ): Promise<PrintRescheduleRequestDto> {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: input.productionOrderItemId },
      select: {
        id: true,
        status: true,
        billboardCode: true,
        printJobs: ITEM_PRINT_JOB_ARGS,
        productionOrder: {
          select: {
            createdByUserId: true,
            orderNumber: true,
            customerName: true,
            customerCompany: true,
          },
        },
        rescheduleRequests: {
          where: { status: PrintRescheduleStatus.PENDING },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!item || item.productionOrder.createdByUserId !== userId) {
      throw new NotFoundException('Valla de producción no encontrada');
    }
    if (
      item.status === ProductionOrderStatus.CANCELLED ||
      item.status === ProductionOrderStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Solo se puede reprogramar una valla pendiente de impresión',
      );
    }
    const job = item.printJobs[0];
    if (job && job.status !== PrintJobStatus.SCHEDULED) {
      throw new BadRequestException(
        'La valla ya está en impresión, no se puede reprogramar',
      );
    }
    if (item.rescheduleRequests.length > 0) {
      throw new BadRequestException(
        'Ya hay una solicitud de reprogramación pendiente para esta valla',
      );
    }

    const preferredDate = input.preferredDate
      ? new Date(input.preferredDate)
      : null;
    if (preferredDate && Number.isNaN(preferredDate.getTime())) {
      throw new BadRequestException('La fecha preferida no es válida');
    }

    const created = await this.prisma.printRescheduleRequest.create({
      data: {
        productionOrderItemId: item.id,
        requestedByUserId: userId,
        reason: input.reason.trim(),
        isUrgent: input.isUrgent ?? false,
        preferredDate,
        previousStartAt: job?.scheduledStartAt ?? null,
      },
      select: RESCHEDULE_REQUEST_SELECT,
    });

    const order = item.productionOrder;
    const parts = [
      created.isUrgent ? 'Urgente:' : null,
      `Solicitud de reprogramación de impresión para ${item.billboardCode ?? 'una valla'}`,
      `(${order.orderNumber} · ${order.customerCompany?.trim() || order.customerName})`,
      preferredDate ? `· prefiere el ${DAY_FORMATTER.format(preferredDate)}` : null,
    ];
    void this.notifyProduction(
      parts.filter(Boolean).join(' '),
      created.isUrgent,
      userId,
    );

    return mapRescheduleRequest(created);
  }

  async cancel(
    userId: string,
    requestId: string,
  ): Promise<PrintRescheduleRequestDto> {
    const request = await this.prisma.printRescheduleRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, requestedByUserId: true },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.requestedByUserId !== userId) {
      throw new ForbiddenException(
        'Solo quien hizo la solicitud puede retirarla',
      );
    }
    if (request.status !== PrintRescheduleStatus.PENDING) {
      throw new BadRequestException('La solicitud ya fue atendida');
    }

    const updated = await this.prisma.printRescheduleRequest.update({
      where: { id: request.id },
      data: { status: PrintRescheduleStatus.CANCELLED },
      select: RESCHEDULE_REQUEST_SELECT,
    });
    return mapRescheduleRequest(updated);
  }

  async resolve(
    userId: string,
    requestId: string,
    input: ResolvePrintRescheduleRequestInput,
  ): Promise<PrintRescheduleQueueItemDto> {
    const request = await this.prisma.printRescheduleRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== PrintRescheduleStatus.PENDING) {
      throw new BadRequestException('La solicitud ya no está pendiente');
    }

    const updated = await this.prisma.printRescheduleRequest.update({
      where: { id: request.id },
      data: {
        status: PrintRescheduleStatus[input.status],
        resolutionNote: input.resolutionNote?.trim() || null,
        resolvedByUserId: userId,
        resolvedAt: new Date(),
      },
      select: QUEUE_SELECT,
    });

    const result = mapQueueItem(updated);
    void this.notifyRequester(result);
    return result;
  }

  private async notifyProduction(
    description: string,
    isUrgent: boolean,
    excludeUserId: string,
  ): Promise<void> {
    try {
      await this.notifications.createForSubRole(
        'PRODUCTION',
        description,
        isUrgent ? 'HIGH' : 'MEDIUM',
        { excludeUserId, href: PRODUCTION_HREF },
      );
    } catch (err) {
      this.logger.error(
        `Failed to notify PRODUCTION of a reschedule request: ${(err as Error).message}`,
      );
    }
  }

  private async notifyRequester(
    request: PrintRescheduleQueueItemDto,
  ): Promise<void> {
    const outcome =
      request.status === PrintRescheduleStatus.RESOLVED
        ? 'fue atendida'
        : 'fue rechazada';
    const schedule = request.printSchedule
      ? ` Nueva fecha: ${DAY_FORMATTER.format(new Date(request.printSchedule.scheduledStartAt))}.`
      : '';
    const note = request.resolutionNote ? ` "${request.resolutionNote}"` : '';
    try {
      await this.notifications.createOne({
        userId: request.requestedBy.id,
        description: `Tu solicitud de reprogramación para ${request.billboardCode ?? 'la valla'} (${request.orderNumber}) ${outcome}.${schedule}${note}`,
        priority: 'MEDIUM',
        href: MY_ORDERS_HREF,
      });
    } catch (err) {
      this.logger.error(
        `Failed to notify requester of reschedule ${request.id}: ${(err as Error).message}`,
      );
    }
  }
}

function mapQueueItem(row: QueueRow): PrintRescheduleQueueItemDto {
  const { productionOrderItem: item, ...request } = row;
  return {
    ...mapRescheduleRequest(request),
    productionOrderId: item.productionOrderId,
    orderNumber: item.productionOrder.orderNumber,
    customerName: item.productionOrder.customerName,
    customerCompany: item.productionOrder.customerCompany,
    billboardCode: item.billboardCode,
    address: item.address,
    cityName: item.cityName,
    width: item.width,
    height: item.height,
    printSchedule: mapItemPrintSchedule(item.printJobs[0]),
  };
}
