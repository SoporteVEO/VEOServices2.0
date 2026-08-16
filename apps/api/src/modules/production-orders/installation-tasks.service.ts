import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ProductionOrderStatus,
  S3ImageType,
  type Prisma,
} from '@prisma/client';
import { BillboardsService } from '../billboards/billboards.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ImageProcessorService } from '../s3-images/image-processor.service.js';
import { S3ImagesService } from '../s3-images/s3-images.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';

const VULCANIZADO_FOLDER = 'production-orders/vulcanizado';

export interface InstallationTaskPersonDto {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export interface InstallationTaskImageDto {
  id: string;
  url: string;
  createdAt: string;
}

export interface InstallationTaskListItemDto {
  id: string;
  status: ProductionOrderStatus;
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  scheduledInstallationAt: string | null;
  installedAt: string | null;
  hasVulcanizadoImage: boolean;
  installationImageCount: number;
}

export interface InstallationTaskDto extends InstallationTaskListItemDto {
  advisorFullName: string | null;
  reference: string | null;
  width: number | null;
  height: number | null;
  latitude: number | null;
  longitude: number | null;
  assignedInstaller: InstallationTaskPersonDto | null;
  vulcanizadoImageUrl: string | null;
  installationImages: InstallationTaskImageDto[];
}

const PERSON_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const TASK_INCLUDE = {
  assignedInstaller: { select: PERSON_SELECT },
  offerItem: {
    select: {
      billboardId: true,
      billboardCode: true,
      address: true,
      cityName: true,
      departmentName: true,
      width: true,
      height: true,
    },
  },
  productionOrder: {
    select: {
      offer: {
        select: {
          offerNumber: true,
          customerName: true,
          customerCompany: true,
          advisorFullName: true,
        },
      },
    },
  },
  installationImages: {
    where: { type: S3ImageType.STATIC_BILLBOARD_INSTALLATION },
    select: { id: true, deleteUrl: true, createdAt: true },
    orderBy: [{ createdAt: 'desc' }],
  },
} satisfies Prisma.ProductionOrderItemInclude;

function decodeBase64Image(base64: string): Buffer {
  const normalized = base64.includes(',') ? base64.split(',')[1] : base64;
  if (!normalized) {
    throw new BadRequestException('La imagen está vacía o es inválida');
  }
  return Buffer.from(normalized, 'base64');
}

/**
 * Backs the mobile installer portal reached through the per-billboard QR
 * code. Kept separate from `ProductionOrdersService` because it serves a
 * different audience (field roles) with its own permission rules.
 */
@Injectable()
export class InstallationTasksService {
  private readonly logger = new Logger(InstallationTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly processor: ImageProcessorService,
    private readonly s3Images: S3ImagesService,
    private readonly billboards: BillboardsService,
  ) {}

  /** Installations assigned to the signed-in installer, soonest first. */
  async listAssignedTo(userId: string): Promise<InstallationTaskListItemDto[]> {
    const rows = await this.prisma.productionOrderItem.findMany({
      where: {
        assignedInstallerId: userId,
        status: { not: ProductionOrderStatus.CANCELLED },
      },
      include: TASK_INCLUDE,
      orderBy: [
        { scheduledInstallationAt: 'asc' },
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    });

    return rows.map((row) => this.mapListItem(row));
  }

  async getTask(itemId: string): Promise<InstallationTaskDto> {
    const row = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      include: TASK_INCLUDE,
    });
    if (!row) throw new NotFoundException('Instalación no encontrada');

    const location = row.offerItem.billboardId
      ? await this.resolveLocation(row.offerItem.billboardId)
      : null;

    const [vulcanizadoImageUrl, installationImages] = await Promise.all([
      row.vulcanizadoImageS3Key
        ? this.storage.getSignedUrl(row.vulcanizadoImageS3Key)
        : Promise.resolve(null),
      Promise.all(
        row.installationImages.map(async (image) => ({
          id: image.id,
          url: await this.storage.getSignedUrl(image.deleteUrl),
          createdAt: image.createdAt.toISOString(),
        })),
      ),
    ]);

    return {
      ...this.mapListItem(row),
      advisorFullName: row.productionOrder.offer.advisorFullName,
      reference: location?.reference ?? null,
      width: row.offerItem.width ?? location?.width ?? null,
      height: row.offerItem.height ?? location?.height ?? null,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      assignedInstaller: row.assignedInstaller,
      vulcanizadoImageUrl,
      installationImages,
    };
  }

  /**
   * Vulcanizado photos live on the item itself (one per installation), so a
   * re-upload replaces the previous file instead of stacking up.
   */
  async uploadVulcanizadoImage(
    itemId: string,
    imageBase64: string,
  ): Promise<InstallationTaskDto> {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      select: { id: true, vulcanizadoImageS3Key: true },
    });
    if (!item) throw new NotFoundException('Instalación no encontrada');

    const processed = await this.processor.toWebp(
      decodeBase64Image(imageBase64),
    );
    const upload = await this.storage.uploadBuffer({
      buffer: processed.buffer,
      mimeType: processed.mimeType,
      extension: processed.extension,
      folder: VULCANIZADO_FOLDER,
    });

    try {
      await this.prisma.productionOrderItem.update({
        where: { id: itemId },
        data: { vulcanizadoImageS3Key: upload.key },
      });
    } catch (e) {
      await this.storage.deleteByKey(upload.key);
      throw e;
    }

    if (item.vulcanizadoImageS3Key) {
      void this.storage.deleteByKey(item.vulcanizadoImageS3Key);
    }

    return this.getTask(itemId);
  }

  async deleteVulcanizadoImage(itemId: string): Promise<InstallationTaskDto> {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      select: { id: true, vulcanizadoImageS3Key: true },
    });
    if (!item) throw new NotFoundException('Instalación no encontrada');
    if (!item.vulcanizadoImageS3Key) {
      throw new NotFoundException('No hay imagen de vulcanizado cargada');
    }

    await this.prisma.productionOrderItem.update({
      where: { id: itemId },
      data: { vulcanizadoImageS3Key: null },
    });
    void this.storage.deleteByKey(item.vulcanizadoImageS3Key);

    return this.getTask(itemId);
  }

  /**
   * Reuses the regular image pipeline so the photo also shows up in
   * `/dashboard/images` and in installation reports, while additionally
   * linking it to the task and stamping the actual installation date.
   */
  async uploadInstallationImage(
    itemId: string,
    userId: string,
    imageBase64: string,
  ): Promise<InstallationTaskDto> {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        installedAt: true,
        offerItem: { select: { billboardCode: true } },
      },
    });
    if (!item) throw new NotFoundException('Instalación no encontrada');

    const staticBillboardCodeId = await this.resolveStaticBillboardCodeId(
      item.offerItem.billboardCode,
    );

    await this.s3Images.create(
      {
        imageBase64,
        type: S3ImageType.STATIC_BILLBOARD_INSTALLATION,
        staticBillboardCodeId,
      },
      userId,
      { productionOrderItemId: itemId },
    );

    if (!item.installedAt) {
      await this.prisma.productionOrderItem.update({
        where: { id: itemId },
        data: { installedAt: new Date() },
      });
    }

    return this.getTask(itemId);
  }

  /**
   * The images module keys everything off `StaticBillboardCodes`, so an offer
   * item carrying a code we have never seen gets one created on the fly.
   */
  private async resolveStaticBillboardCodeId(
    billboardCode: string | null,
  ): Promise<string | null> {
    const code = billboardCode?.trim().toUpperCase();
    if (!code) return null;

    const record = await this.prisma.staticBillboardCodes.upsert({
      where: { code },
      create: { code },
      update: {},
      select: { id: true },
    });
    return record.id;
  }

  private async resolveLocation(billboardId: number) {
    try {
      return await this.billboards.getBillboardLocation(billboardId);
    } catch (err) {
      this.logger.warn(
        `Could not resolve Brilo location for billboard ${billboardId}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private mapListItem(row: {
    id: string;
    status: ProductionOrderStatus;
    scheduledInstallationAt: Date | null;
    installedAt: Date | null;
    vulcanizadoImageS3Key: string | null;
    installationImages: { id: string }[];
    offerItem: {
      billboardCode: string | null;
      address: string | null;
      cityName: string | null;
      departmentName: string | null;
    };
    productionOrder: {
      offer: {
        offerNumber: string;
        customerName: string;
        customerCompany: string | null;
      };
    };
  }): InstallationTaskListItemDto {
    return {
      id: row.id,
      status: row.status,
      offerNumber: row.productionOrder.offer.offerNumber,
      customerName: row.productionOrder.offer.customerName,
      customerCompany: row.productionOrder.offer.customerCompany,
      billboardCode: row.offerItem.billboardCode,
      address: row.offerItem.address,
      cityName: row.offerItem.cityName,
      departmentName: row.offerItem.departmentName,
      scheduledInstallationAt:
        row.scheduledInstallationAt?.toISOString() ?? null,
      installedAt: row.installedAt?.toISOString() ?? null,
      hasVulcanizadoImage: !!row.vulcanizadoImageS3Key,
      installationImageCount: row.installationImages.length,
    };
  }
}
