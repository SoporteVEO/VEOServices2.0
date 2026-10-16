import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  OfferItemType,
  OfferStatus,
  ProductionOrderStatus,
  Role,
  S3ImageType,
  type Prisma,
} from '@prisma/client';
import {
  INSTALLATION_ROLES,
  INSTALLER_ROLES,
  VULCANIZADO_ROLES,
} from '../auth/field-roles.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ITEM_PRINT_JOB_ARGS,
  ITEM_RESCHEDULE_REQUEST_ARGS,
  mapItemPrintSchedule,
  mapRescheduleRequest,
  type ItemPrintScheduleDto,
  type PrintRescheduleRequestDto,
} from '../printing/print-schedule.js';
import { PushService } from '../push/push.service.js';
import {
  S3StorageService,
  type PresignedPutResult,
} from '../s3-images/s3-storage.service.js';
import {
  MAX_PRODUCTION_ART_BYTES,
  PRODUCTION_ART_EXTENSIONS,
  PRODUCTION_ART_FOLDER,
} from './production-order-art.js';

export type ProductionDocumentKind = 'PRODUCTION' | 'DESIGN';

export interface DocumentActor {
  userId: string;
  isProductionUser: boolean;
}

export interface ProductionOrderArtDto {
  fileName: string;
  mimeType: string;
  uploadedAt: string;
}

export interface InstallerSummaryDto {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: Role;
}

export interface ProductionOrderItemDto {
  id: string;
  offerItemId: string | null;
  billboardId: number | null;
  status: ProductionOrderStatus;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
  art: ProductionOrderArtDto | null;
  hasProductionDocument: boolean;
  hasDesignDocument: boolean;
  assignedInstaller: InstallerSummaryDto | null;
  assignedVulcanizador: InstallerSummaryDto | null;
  scheduledInstallationAt: string | null;
  installedAt: string | null;
  hasVulcanizadoImage: boolean;
  installationImageCount: number;
  printSchedule: ItemPrintScheduleDto | null;
  latestRescheduleRequest: PrintRescheduleRequestDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionOrderDto {
  id: string;
  offerId: string | null;
  orderNumber: string;
  isManual: boolean;
  customerName: string;
  customerCompany: string | null;
  advisorFullName: string | null;
  notes: string | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
  itemCount: number;
  aggregateStatus: ProductionOrderStatus;
  statusCounts: Record<ProductionOrderStatus, number>;
  items: ProductionOrderItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateManualProductionOrderInput {
  customerName: string;
  customerCompany?: string;
  notes?: string;
  items: {
    billboardId: number;
    billboardCode?: string;
    address?: string;
    cityName?: string;
    departmentName?: string;
    width?: number;
    height?: number;
  }[];
}

export interface ListProductionOrdersFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: ProductionOrderStatus;
}

export interface PaginatedProductionOrders {
  data: ProductionOrderDto[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function clampPage(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(Math.floor(value), 1);
}

function clampPageSize(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
}

const STATUS_PRIORITY: ProductionOrderStatus[] = [
  ProductionOrderStatus.CANCELLED,
  ProductionOrderStatus.RECEIVED,
  ProductionOrderStatus.IN_PRODUCTION,
  ProductionOrderStatus.COMPLETED,
];

/**
 * Rolls a set of per-item statuses up into a single aggregate for the
 * grouping row. We use "worst-first" priority so a single cancelled or
 * pending item surfaces at the campaign level.
 */
function resolveAggregateStatus(
  statuses: ProductionOrderStatus[],
): ProductionOrderStatus {
  if (statuses.length === 0) return ProductionOrderStatus.RECEIVED;
  const set = new Set(statuses);
  for (const status of STATUS_PRIORITY) {
    if (set.has(status)) return status;
  }
  return statuses[0];
}

const ASSIGNEE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

const ITEM_INCLUDE = {
  assignedInstaller: { select: ASSIGNEE_SELECT },
  assignedVulcanizador: { select: ASSIGNEE_SELECT },
  installationImages: {
    where: { type: S3ImageType.STATIC_BILLBOARD_INSTALLATION },
    select: { id: true },
  },
  printJobs: ITEM_PRINT_JOB_ARGS,
  rescheduleRequests: ITEM_RESCHEDULE_REQUEST_ARGS,
} satisfies Prisma.ProductionOrderItemInclude;

const ORDER_INCLUDE = {
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  items: {
    include: ITEM_INCLUDE,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.ProductionOrderInclude;

type ProductionOrderInclude = Prisma.ProductionOrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

type ProductionOrderItemInclude = Prisma.ProductionOrderItemGetPayload<{
  include: typeof ITEM_INCLUDE;
}>;

export interface ProductionOrderNotificationMeta {
  orderNumber: string;
  customerName: string;
  customerCompany: string | null;
  itemCount: number;
  /** Skipped when fanning out, e.g. the production user who created it. */
  excludeUserId?: string;
}

const MANUAL_ORDER_PREFIX = 'ODP';

export interface CreateProductionOrderResult {
  created: boolean;
  meta: ProductionOrderNotificationMeta | null;
}

@Injectable()
export class ProductionOrdersService {
  private readonly logger = new Logger(ProductionOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  /**
   * Creates a ProductionOrder for a freshly accepted offer, one row per
   * static-billboard offer item. Idempotent by design: if the offer already
   * has a production order, this is a no-op.
   *
   * Returns `{ created: true, meta }` only when a brand-new order was
   * inserted, so callers can dispatch side effects (e.g. notifications)
   * after the surrounding transaction commits.
   */
  async createForAcceptedOffer(
    tx: Prisma.TransactionClient,
    offerId: string,
  ): Promise<CreateProductionOrderResult> {
    const offer = await tx.offerCreated.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        status: true,
        offerNumber: true,
        customerName: true,
        customerCompany: true,
        advisorFullName: true,
        createdByUserId: true,
        items: {
          where: { itemType: OfferItemType.STATIC_BILLBOARD },
          select: {
            id: true,
            billboardId: true,
            billboardCode: true,
            address: true,
            cityName: true,
            departmentName: true,
            width: true,
            height: true,
            quantity: true,
          },
        },
        productionOrder: { select: { id: true } },
      },
    });
    if (!offer) return { created: false, meta: null };
    if (offer.status !== OfferStatus.ACCEPTED)
      return { created: false, meta: null };
    if (offer.productionOrder) return { created: false, meta: null };
    if (offer.items.length === 0) return { created: false, meta: null };

    await tx.productionOrder.create({
      data: {
        offerId: offer.id,
        orderNumber: offer.offerNumber,
        customerName: offer.customerName,
        customerCompany: offer.customerCompany,
        advisorFullName: offer.advisorFullName,
        createdByUserId: offer.createdByUserId,
        items: {
          create: offer.items.map(({ id, ...billboard }) => ({
            offerItemId: id,
            ...billboard,
          })),
        },
      },
    });

    return {
      created: true,
      meta: {
        orderNumber: offer.offerNumber,
        customerName: offer.customerName,
        customerCompany: offer.customerCompany,
        itemCount: offer.items.length,
      },
    };
  }

  /**
   * Fan-out an in-app notification to every active user with the PRODUCTION
   * sub-role. Errors are logged but never thrown so a failed notification
   * doesn't block the acceptance flow.
   */
  async notifyProductionUsersOfNewOrder(
    meta: ProductionOrderNotificationMeta,
  ): Promise<void> {
    const label = meta.customerCompany?.trim()
      ? `${meta.customerCompany.trim()} (${meta.customerName})`
      : meta.customerName;
    const description = `Nueva orden de producción ${meta.orderNumber} para ${label} · ${meta.itemCount} valla${meta.itemCount === 1 ? '' : 's'} estática${meta.itemCount === 1 ? '' : 's'}`;

    try {
      const result = await this.notifications.createForSubRole(
        'PRODUCTION',
        description,
        'HIGH',
        { excludeUserId: meta.excludeUserId, href: '/dashboard/production' },
      );
      this.logger.log(
        `Created ${result.count} PRODUCTION notification(s) for order ${meta.orderNumber}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to notify PRODUCTION users for order ${meta.orderNumber}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Production orders that do not come from an offer, e.g. a reprint or an
   * internal campaign. Art is uploaded afterwards through the regular
   * per-item endpoints, since the creator owns the order.
   */
  async createManual(
    userId: string,
    input: CreateManualProductionOrderInput,
  ): Promise<ProductionOrderDto> {
    const billboardIds = input.items.map((item) => item.billboardId);
    if (new Set(billboardIds).size !== billboardIds.length) {
      throw new BadRequestException(
        'Una valla no puede agregarse dos veces a la misma orden',
      );
    }

    const orderNumber = await this.generateManualOrderNumber();
    const customerName = input.customerName.trim();
    const customerCompany = input.customerCompany?.trim() || null;

    const created = await this.prisma.productionOrder.create({
      data: {
        orderNumber,
        customerName,
        customerCompany,
        notes: input.notes?.trim() || null,
        createdByUserId: userId,
        items: {
          create: input.items.map((item) => ({
            billboardId: item.billboardId,
            billboardCode: item.billboardCode?.trim() || null,
            address: item.address?.trim() || null,
            cityName: item.cityName?.trim() || null,
            departmentName: item.departmentName?.trim() || null,
            width: item.width ?? null,
            height: item.height ?? null,
          })),
        },
      },
      include: this.orderInclude(),
    });

    void this.notifyProductionUsersOfNewOrder({
      orderNumber,
      customerName,
      customerCompany,
      itemCount: input.items.length,
      excludeUserId: userId,
    });

    return this.mapToDto(created);
  }

  private async generateManualOrderNumber(): Promise<string> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const yearSuffix = String(now.getFullYear()).slice(-2);
    const numberPattern = `^${MANUAL_ORDER_PREFIX}[0-9]+/${yearSuffix}$`;

    const rows = await this.prisma.$queryRaw<
      Array<{ max_sequence: number | null }>
    >`
      SELECT MAX(
        CASE
          WHEN "order_number" ~ ${numberPattern}
          THEN CAST(
            SUBSTRING(
              "order_number"
              FROM 4
              FOR POSITION('/' IN "order_number") - 4
            ) AS INTEGER
          )
          ELSE NULL
        END
      ) AS max_sequence
      FROM "production_orders"
      WHERE "createdAt" >= ${yearStart}
        AND "createdAt" < ${yearEnd}
    `;

    const maxSequence = Number(rows[0]?.max_sequence ?? 0);
    return `${MANUAL_ORDER_PREFIX}${String(maxSequence + 1).padStart(4, '0')}/${yearSuffix}`;
  }

  /**
   * Removes the production order (and its uploaded files from S3)
   * when an offer moves away from ACCEPTED. Called from the offers
   * service so both flows stay in sync.
   */
  async removeForOffer(
    tx: Prisma.TransactionClient,
    offerId: string,
  ): Promise<void> {
    const order = await tx.productionOrder.findUnique({
      where: { offerId },
      select: {
        id: true,
        items: {
          select: {
            productionDocumentS3Key: true,
            designDocumentS3Key: true,
            artS3Key: true,
            vulcanizadoImageS3Key: true,
          },
        },
      },
    });
    if (!order) return;

    const keys = order.items.flatMap((item) =>
      [
        item.productionDocumentS3Key,
        item.designDocumentS3Key,
        item.artS3Key,
        item.vulcanizadoImageS3Key,
      ].filter((v): v is string => Boolean(v)),
    );

    await tx.productionOrder.delete({ where: { id: order.id } });

    for (const key of keys) {
      void this.storage.deleteByKey(key);
    }
  }

  async listMine(
    userId: string,
    filters: ListProductionOrdersFilters = {},
  ): Promise<PaginatedProductionOrders> {
    return this.listWithFilters(filters, { createdByUserId: userId });
  }

  async list(
    filters: ListProductionOrdersFilters = {},
  ): Promise<PaginatedProductionOrders> {
    return this.listWithFilters(filters, undefined);
  }

  private async listWithFilters(
    filters: ListProductionOrdersFilters,
    constraint: Prisma.ProductionOrderWhereInput | undefined,
  ): Promise<PaginatedProductionOrders> {
    const page = clampPage(filters.page);
    const pageSize = clampPageSize(filters.pageSize);
    const search = filters.search?.trim();
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductionOrderWhereInput = {
      ...(constraint ?? {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { customerName: { contains: search, mode: 'insensitive' } },
              { customerCompany: { contains: search, mode: 'insensitive' } },
              {
                items: {
                  some: {
                    billboardCode: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
      ...(filters.status
        ? { items: { some: { status: filters.status } } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.productionOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: this.orderInclude(),
      }),
      this.prisma.productionOrder.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapToDto(row)),
      total,
      page,
      pageSize,
    };
  }

  async getMineById(userId: string, id: string): Promise<ProductionOrderDto> {
    const row = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: this.orderInclude(),
    });
    if (!row) throw new NotFoundException('Orden de producción no encontrada');
    if (row.createdByUserId !== userId) {
      throw new NotFoundException('Orden de producción no encontrada');
    }
    return this.mapToDto(row);
  }

  async getById(id: string): Promise<ProductionOrderDto> {
    const row = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: this.orderInclude(),
    });
    if (!row) throw new NotFoundException('Orden de producción no encontrada');
    return this.mapToDto(row);
  }

  /**
   * The order's creator uploads the art of each billboard. On manual orders
   * the whole production team may do so too, since there is no salesperson
   * behind them. The file goes straight to S3 so its size is not bound by
   * the API body limit; `attachArt` then links it to the item.
   */
  async createArtUploadUrl(
    actor: DocumentActor,
    itemId: string,
    mimeType: string,
  ): Promise<PresignedPutResult> {
    await this.findItemEditableBy(itemId, actor);
    return this.storage.getPresignedPutUrl({
      extension: PRODUCTION_ART_EXTENSIONS[mimeType],
      mimeType,
      folder: PRODUCTION_ART_FOLDER,
    });
  }

  async attachArt(
    actor: DocumentActor,
    itemId: string,
    input: { fileKey: string; fileName: string; mimeType: string },
  ): Promise<ProductionOrderItemDto> {
    const item = await this.findItemEditableBy(itemId, actor);

    let size: number;
    try {
      size = await this.storage.getObjectSize(input.fileKey);
    } catch {
      throw new BadRequestException('No se encontró el archivo del arte');
    }
    if (size <= 0 || size > MAX_PRODUCTION_ART_BYTES) {
      void this.storage.deleteByKey(input.fileKey);
      throw new BadRequestException(
        `El arte debe pesar menos de ${MAX_PRODUCTION_ART_BYTES / (1024 * 1024)}MB`,
      );
    }

    const updated = await this.prisma.productionOrderItem.update({
      where: { id: itemId },
      data: {
        artS3Key: input.fileKey,
        artFileName: input.fileName.trim(),
        artMimeType: input.mimeType,
        artUploadedAt: new Date(),
      },
      include: ITEM_INCLUDE,
    });

    if (item.artS3Key && item.artS3Key !== input.fileKey) {
      void this.storage.deleteByKey(item.artS3Key);
    }

    return this.mapItemToDto(updated);
  }

  async deleteArt(
    actor: DocumentActor,
    itemId: string,
  ): Promise<ProductionOrderItemDto> {
    const item = await this.findItemEditableBy(itemId, actor);
    if (!item.artS3Key) {
      throw new NotFoundException('El arte no existe');
    }

    const updated = await this.prisma.productionOrderItem.update({
      where: { id: itemId },
      data: {
        artS3Key: null,
        artFileName: null,
        artMimeType: null,
        artUploadedAt: null,
      },
      include: ITEM_INCLUDE,
    });

    void this.storage.deleteByKey(item.artS3Key);

    return this.mapItemToDto(updated);
  }

  async getArtUrl(
    itemId: string,
    options: { userId?: string; requireOwnership: boolean; download: boolean },
  ): Promise<{ url: string }> {
    const item = await this.findItemForDownload(itemId, options);
    if (!item.artS3Key) {
      throw new NotFoundException('El arte no está disponible');
    }

    const url = await this.storage.getSignedUrl(
      item.artS3Key,
      undefined,
      options.download ? (item.artFileName ?? undefined) : undefined,
    );
    return { url };
  }

  /** Read-only access to the deprecated production/design PDFs. */
  async getDocumentDownloadUrl(
    itemId: string,
    kind: ProductionDocumentKind,
    options: { userId?: string; requireOwnership: boolean },
  ): Promise<{ url: string }> {
    const item = await this.findItemForDownload(itemId, options);
    const key =
      kind === 'PRODUCTION'
        ? item.productionDocumentS3Key
        : item.designDocumentS3Key;
    if (!key) {
      throw new NotFoundException('El documento no está disponible');
    }

    const url = await this.storage.getSignedUrl(key);
    return { url };
  }

  private async findItemForDownload(
    itemId: string,
    options: { userId?: string; requireOwnership: boolean },
  ) {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      select: {
        productionDocumentS3Key: true,
        designDocumentS3Key: true,
        artS3Key: true,
        artFileName: true,
        productionOrder: { select: { createdByUserId: true } },
      },
    });
    if (!item) throw new NotFoundException('Orden de producción no encontrada');

    if (
      options.requireOwnership &&
      item.productionOrder.createdByUserId !== options.userId
    ) {
      throw new NotFoundException('Orden de producción no encontrada');
    }
    return item;
  }

  /**
   * Called by users with the PRODUCTION sub-role to move a static-billboard
   * production item across the workflow (RECEIVED → IN_PRODUCTION →
   * COMPLETED, or CANCELLED at any point).
   */
  async updateItemStatus(
    itemId: string,
    status: ProductionOrderStatus,
  ): Promise<ProductionOrderItemDto> {
    const existing = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Orden de producción no encontrada');
    }

    const updated = await this.prisma.productionOrderItem.update({
      where: { id: itemId },
      data: { status },
      include: ITEM_INCLUDE,
    });
    return this.mapItemToDto(updated);
  }

  /**
   * Assigns (or clears) the field users responsible for a static billboard:
   * the installer who mounts it, the vulcanizador who prepares the material,
   * and the planned installation date. All of them feed the QR portal.
   */
  async updateItemAssignment(
    itemId: string,
    input: {
      assignedInstallerId?: string | null;
      assignedVulcanizadorId?: string | null;
      scheduledInstallationAt?: string | null;
    },
  ): Promise<ProductionOrderItemDto> {
    const existing = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        assignedInstallerId: true,
        assignedVulcanizadorId: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Orden de producción no encontrada');
    }

    const data: Prisma.ProductionOrderItemUpdateInput = {};

    if (input.assignedInstallerId !== undefined) {
      data.assignedInstaller = await this.resolveAssignee(
        input.assignedInstallerId,
        INSTALLATION_ROLES,
        'El usuario seleccionado no es un instalador activo',
      );
    }

    if (input.assignedVulcanizadorId !== undefined) {
      data.assignedVulcanizador = await this.resolveAssignee(
        input.assignedVulcanizadorId,
        VULCANIZADO_ROLES,
        'El usuario seleccionado no es un vulcanizador activo',
      );
    }

    if (input.scheduledInstallationAt !== undefined) {
      data.scheduledInstallationAt = parseOptionalDate(
        input.scheduledInstallationAt,
      );
    }

    const updated = await this.prisma.productionOrderItem.update({
      where: { id: itemId },
      data,
      include: {
        ...ITEM_INCLUDE,
        productionOrder: {
          select: {
            orderNumber: true,
            customerCompany: true,
            customerName: true,
          },
        },
      },
    });

    const { productionOrder } = updated;
    const notification = {
      body: [
        productionOrder.customerCompany ?? productionOrder.customerName,
        updated.billboardCode ?? updated.address,
      ]
        .filter(Boolean)
        .join(' · '),
      url: `/portal/${updated.id}`,
    };

    if (
      updated.assignedInstallerId &&
      updated.assignedInstallerId !== existing.assignedInstallerId
    ) {
      void this.push.sendToUser(updated.assignedInstallerId, {
        ...notification,
        title: 'Nueva instalación asignada',
        tag: `installation-${updated.id}`,
      });
    }

    if (
      updated.assignedVulcanizadorId &&
      updated.assignedVulcanizadorId !== existing.assignedVulcanizadorId
    ) {
      void this.push.sendToUser(updated.assignedVulcanizadorId, {
        ...notification,
        title: 'Nuevo vulcanizado asignado',
        tag: `vulcanizado-${updated.id}`,
      });
    }

    return this.mapItemToDto(updated);
  }

  private async resolveAssignee(
    userId: string | null,
    roles: Role[],
    invalidMessage: string,
  ): Promise<{ disconnect: true } | { connect: { id: string } }> {
    if (userId === null) return { disconnect: true };
    const user = await this.prisma.user.findFirst({
      where: { id: userId, disabled: false, role: { in: roles } },
      select: { id: true },
    });
    if (!user) throw new BadRequestException(invalidMessage);
    return { connect: { id: user.id } };
  }

  /** Active users that can be picked as the installer for a billboard. */
  async listAssignableInstallers(): Promise<InstallerSummaryDto[]> {
    return this.prisma.user.findMany({
      where: { disabled: false, role: { in: INSTALLER_ROLES } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  private async findItemEditableBy(itemId: string, actor: DocumentActor) {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      include: {
        ...ITEM_INCLUDE,
        productionOrder: {
          select: { createdByUserId: true, offerId: true },
        },
      },
    });
    if (!item) throw new NotFoundException('Orden de producción no encontrada');

    const isOwner = item.productionOrder.createdByUserId === actor.userId;
    const isManualForProduction =
      actor.isProductionUser && item.productionOrder.offerId === null;
    if (!isOwner && !isManualForProduction) {
      throw new ForbiddenException(
        'No tienes permisos para modificar esta orden de producción',
      );
    }
    return item;
  }

  private orderInclude() {
    return ORDER_INCLUDE;
  }

  private mapToDto(row: ProductionOrderInclude): ProductionOrderDto {
    const items = row.items.map((item) => this.mapItemToDto(item));
    const statuses = items.map((item) => item.status);
    const counts: Record<ProductionOrderStatus, number> = {
      RECEIVED: 0,
      IN_PRODUCTION: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const s of statuses) counts[s] += 1;

    return {
      id: row.id,
      offerId: row.offerId,
      orderNumber: row.orderNumber,
      isManual: row.offerId === null,
      customerName: row.customerName,
      customerCompany: row.customerCompany,
      advisorFullName: row.advisorFullName,
      notes: row.notes,
      createdBy: row.createdBy,
      itemCount: items.length,
      aggregateStatus: resolveAggregateStatus(statuses),
      statusCounts: counts,
      items,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapItemToDto(
    item: ProductionOrderItemInclude,
  ): ProductionOrderItemDto {
    return {
      id: item.id,
      offerItemId: item.offerItemId,
      billboardId: item.billboardId,
      status: item.status,
      billboardCode: item.billboardCode,
      address: item.address,
      cityName: item.cityName,
      departmentName: item.departmentName,
      width: item.width,
      height: item.height,
      quantity: item.quantity,
      art:
        item.artS3Key && item.artFileName && item.artMimeType
          ? {
              fileName: item.artFileName,
              mimeType: item.artMimeType,
              uploadedAt: (item.artUploadedAt ?? item.updatedAt).toISOString(),
            }
          : null,
      hasProductionDocument: !!item.productionDocumentS3Key,
      hasDesignDocument: !!item.designDocumentS3Key,
      assignedInstaller: item.assignedInstaller,
      assignedVulcanizador: item.assignedVulcanizador,
      scheduledInstallationAt:
        item.scheduledInstallationAt?.toISOString() ?? null,
      installedAt: item.installedAt?.toISOString() ?? null,
      hasVulcanizadoImage: !!item.vulcanizadoImageS3Key,
      installationImageCount: item.installationImages.length,
      printSchedule: mapItemPrintSchedule(item.printJobs[0]),
      latestRescheduleRequest: item.rescheduleRequests[0]
        ? mapRescheduleRequest(item.rescheduleRequests[0])
        : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}

function parseOptionalDate(value: string | null): Date | null {
  if (value === null || value.trim() === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('La fecha de instalación no es válida');
  }
  return parsed;
}
