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
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';

const PRODUCTION_DOCS_FOLDER = 'production-orders';

export type ProductionDocumentKind = 'PRODUCTION' | 'DESIGN';

export interface InstallerSummaryDto {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: Role;
}

export interface ProductionOrderItemDto {
  id: string;
  offerItemId: string;
  status: ProductionOrderStatus;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
  hasProductionDocument: boolean;
  hasDesignDocument: boolean;
  assignedInstaller: InstallerSummaryDto | null;
  scheduledInstallationAt: string | null;
  installedAt: string | null;
  hasVulcanizadoImage: boolean;
  installationImageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionOrderDto {
  id: string;
  offerId: string;
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  advisorFullName: string | null;
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

function decodeBase64Pdf(base64: string): Buffer {
  const normalized = base64.includes(',') ? base64.split(',')[1] : base64;
  if (!normalized) {
    throw new BadRequestException('El PDF está vacío o es inválido');
  }
  const buffer = Buffer.from(normalized, 'base64');
  if (buffer.length < 4 || buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
    throw new BadRequestException('El archivo no es un PDF válido');
  }
  return buffer;
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

const ITEM_INCLUDE = {
  offerItem: {
    select: {
      id: true,
      billboardCode: true,
      address: true,
      cityName: true,
      departmentName: true,
      width: true,
      height: true,
      quantity: true,
    },
  },
  assignedInstaller: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
  installationImages: {
    where: { type: S3ImageType.STATIC_BILLBOARD_INSTALLATION },
    select: { id: true },
  },
} satisfies Prisma.ProductionOrderItemInclude;

const ORDER_INCLUDE = {
  offer: {
    select: {
      id: true,
      offerNumber: true,
      customerName: true,
      customerCompany: true,
      advisorFullName: true,
      createdByUserId: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
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

/** Roles that may be put on the hook for a physical billboard installation. */
const INSTALLER_ROLES: Role[] = [Role.INSTALLER, Role.WORKER];

export interface ProductionOrderNotificationMeta {
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  itemCount: number;
}

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
        items: {
          where: { itemType: OfferItemType.STATIC_BILLBOARD },
          select: { id: true },
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
        items: {
          create: offer.items.map((item) => ({
            offerItemId: item.id,
          })),
        },
      },
    });

    return {
      created: true,
      meta: {
        offerNumber: offer.offerNumber,
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
    const description = `Nueva orden de producción ${meta.offerNumber} para ${label} · ${meta.itemCount} valla${meta.itemCount === 1 ? '' : 's'} estática${meta.itemCount === 1 ? '' : 's'}`;

    try {
      const result = await this.notifications.createForSubRole(
        'PRODUCTION',
        description,
        'HIGH',
      );
      this.logger.log(
        `Created ${result.count} PRODUCTION notification(s) for offer ${meta.offerNumber}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to notify PRODUCTION users for offer ${meta.offerNumber}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Removes the production order (and its uploaded documents from S3)
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
    offerConstraint: Prisma.OfferCreatedWhereInput | undefined,
  ): Promise<PaginatedProductionOrders> {
    const page = clampPage(filters.page);
    const pageSize = clampPageSize(filters.pageSize);
    const search = filters.search?.trim();
    const skip = (page - 1) * pageSize;

    const offerWhere: Prisma.OfferCreatedWhereInput = {
      ...(offerConstraint ?? {}),
      ...(search
        ? {
            OR: [
              { offerNumber: { contains: search, mode: 'insensitive' } },
              { customerName: { contains: search, mode: 'insensitive' } },
              { customerCompany: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const where: Prisma.ProductionOrderWhereInput = {
      offer: offerWhere,
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
    if (row.offer.createdByUserId !== userId) {
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
   * Only the user that originally created the offer can upload the
   * corresponding production/design documents.
   */
  async uploadDocument(
    userId: string,
    itemId: string,
    kind: ProductionDocumentKind,
    pdfBase64: string,
  ): Promise<ProductionOrderItemDto> {
    const item = await this.findItemOwnedByUser(itemId, userId);

    const buffer = decodeBase64Pdf(pdfBase64);
    const upload = await this.storage.uploadBuffer({
      buffer,
      mimeType: 'application/pdf',
      extension: 'pdf',
      folder: PRODUCTION_DOCS_FOLDER,
    });

    const previousKey = pickDocumentKey(item, kind);

    try {
      const updated = await this.prisma.productionOrderItem.update({
        where: { id: itemId },
        data: buildDocumentUpdate(kind, upload.key),
        include: ITEM_INCLUDE,
      });

      if (previousKey && previousKey !== upload.key) {
        void this.storage.deleteByKey(previousKey);
      }

      return this.mapItemToDto(updated);
    } catch (e) {
      await this.storage.deleteByKey(upload.key);
      throw e;
    }
  }

  async deleteDocument(
    userId: string,
    itemId: string,
    kind: ProductionDocumentKind,
  ): Promise<ProductionOrderItemDto> {
    const item = await this.findItemOwnedByUser(itemId, userId);
    const key = pickDocumentKey(item, kind);
    if (!key) {
      throw new NotFoundException('El documento no existe');
    }

    const updated = await this.prisma.productionOrderItem.update({
      where: { id: itemId },
      data: buildDocumentUpdate(kind, null),
      include: ITEM_INCLUDE,
    });

    void this.storage.deleteByKey(key);

    return this.mapItemToDto(updated);
  }

  async getDocumentDownloadUrl(
    itemId: string,
    kind: ProductionDocumentKind,
    options: { userId?: string; requireOwnership: boolean },
  ): Promise<{ url: string }> {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      select: {
        productionDocumentS3Key: true,
        designDocumentS3Key: true,
        productionOrder: {
          select: {
            offer: { select: { createdByUserId: true } },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Orden de producción no encontrada');

    if (options.requireOwnership && options.userId) {
      if (item.productionOrder.offer.createdByUserId !== options.userId) {
        throw new NotFoundException('Orden de producción no encontrada');
      }
    }

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
   * Assigns (or clears) the field user responsible for physically installing
   * a static billboard, along with the planned installation date. Both fields
   * feed the QR portal the installer opens on site.
   */
  async updateItemAssignment(
    itemId: string,
    input: {
      assignedInstallerId?: string | null;
      scheduledInstallationAt?: string | null;
    },
  ): Promise<ProductionOrderItemDto> {
    const existing = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Orden de producción no encontrada');
    }

    const data: Prisma.ProductionOrderItemUpdateInput = {};

    if (input.assignedInstallerId !== undefined) {
      if (input.assignedInstallerId === null) {
        data.assignedInstaller = { disconnect: true };
      } else {
        const installer = await this.prisma.user.findFirst({
          where: {
            id: input.assignedInstallerId,
            disabled: false,
            role: { in: INSTALLER_ROLES },
          },
          select: { id: true },
        });
        if (!installer) {
          throw new BadRequestException(
            'El usuario seleccionado no es un instalador activo',
          );
        }
        data.assignedInstaller = { connect: { id: installer.id } };
      }
    }

    if (input.scheduledInstallationAt !== undefined) {
      data.scheduledInstallationAt = parseOptionalDate(
        input.scheduledInstallationAt,
      );
    }

    const updated = await this.prisma.productionOrderItem.update({
      where: { id: itemId },
      data,
      include: ITEM_INCLUDE,
    });
    return this.mapItemToDto(updated);
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

  private async findItemOwnedByUser(itemId: string, userId: string) {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      include: {
        ...ITEM_INCLUDE,
        productionOrder: {
          select: {
            offer: { select: { createdByUserId: true } },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Orden de producción no encontrada');
    if (item.productionOrder.offer.createdByUserId !== userId) {
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
      offerId: row.offer.id,
      offerNumber: row.offer.offerNumber,
      customerName: row.offer.customerName,
      customerCompany: row.offer.customerCompany,
      advisorFullName: row.offer.advisorFullName,
      createdBy: row.offer.createdBy,
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
      status: item.status,
      billboardCode: item.offerItem.billboardCode,
      address: item.offerItem.address,
      cityName: item.offerItem.cityName,
      departmentName: item.offerItem.departmentName,
      width: item.offerItem.width,
      height: item.offerItem.height,
      quantity: item.offerItem.quantity,
      hasProductionDocument: !!item.productionDocumentS3Key,
      hasDesignDocument: !!item.designDocumentS3Key,
      assignedInstaller: item.assignedInstaller,
      scheduledInstallationAt:
        item.scheduledInstallationAt?.toISOString() ?? null,
      installedAt: item.installedAt?.toISOString() ?? null,
      hasVulcanizadoImage: !!item.vulcanizadoImageS3Key,
      installationImageCount: item.installationImages.length,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}

function pickDocumentKey(
  item: {
    productionDocumentS3Key: string | null;
    designDocumentS3Key: string | null;
  },
  kind: ProductionDocumentKind,
): string | null {
  return kind === 'PRODUCTION'
    ? item.productionDocumentS3Key
    : item.designDocumentS3Key;
}

function parseOptionalDate(value: string | null): Date | null {
  if (value === null || value.trim() === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('La fecha de instalación no es válida');
  }
  return parsed;
}

function buildDocumentUpdate(
  kind: ProductionDocumentKind,
  key: string | null,
): Prisma.ProductionOrderItemUpdateInput {
  return kind === 'PRODUCTION'
    ? { productionDocumentS3Key: key }
    : { designDocumentS3Key: key };
}
