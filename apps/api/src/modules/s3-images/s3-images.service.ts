import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { S3ImageType } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateS3ImageDto } from './dto/create-s3-image.dto.js';
import { ImageProcessorService } from './image-processor.service.js';
import { S3StorageService } from './s3-storage.service.js';

export interface S3ImageListItem {
  id: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  uploadedUserId: string;
  uploadedUser: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
  tags: string[];
  type: S3ImageType;
  staticBillboardCodeId: string | null;
  staticBillboardCode: {
    id: string;
    code: string;
  } | null;
}

export type SortOrder = 'asc' | 'desc';

export interface ListS3ImagesFilters {
  type?: S3ImageType;
  staticBillboardCodeId?: string;
  code?: string;
  uploadedUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortOrder?: SortOrder;
  limit?: number;
  cursor?: string;
}

export interface PaginatedS3Images {
  data: S3ImageListItem[];
  nextCursor: string | null;
}

export interface S3ImageUploader {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

const STATIC_BILLBOARD_FOLDERS: Record<S3ImageType, string> = {
  STATIC_BILLBOARD_MONTHLY: 'static-billboards/monthly',
};

function decodeBase64Image(base64: string): Buffer {
  const normalized = base64.includes(',') ? base64.split(',')[1] : base64;
  if (!normalized) {
    throw new BadRequestException('La imagen está vacía o es inválida');
  }
  return Buffer.from(normalized, 'base64');
}

function clampLimit(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
}

@Injectable()
export class S3ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly processor: ImageProcessorService,
  ) {}

  async list(filters: ListS3ImagesFilters = {}): Promise<PaginatedS3Images> {
    const limit = clampLimit(filters.limit);
    const sortOrder: SortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Prisma.S3ImageWhereInput = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.staticBillboardCodeId
        ? { staticBillboardCodeId: filters.staticBillboardCodeId }
        : {}),
      ...(filters.uploadedUserId
        ? { uploadedUserId: filters.uploadedUserId }
        : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
      ...(filters.code
        ? {
            staticBillboardCode: {
              code: { contains: filters.code, mode: 'insensitive' },
            },
          }
        : {}),
    };

    const rows = await this.prisma.s3Image.findMany({
      where,
      take: limit + 1,
      ...(filters.cursor ? { skip: 1, cursor: { id: filters.cursor } } : {}),
      orderBy: [{ createdAt: sortOrder }, { id: sortOrder }],
      include: {
        uploadedUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        staticBillboardCode: { select: { id: true, code: true } },
      },
    });

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1].id : null;

    const signed = await Promise.all(
      pageRows.map((row) => this.storage.getSignedUrl(row.deleteUrl)),
    );

    return {
      data: pageRows.map((row, i) => ({
        id: row.id,
        url: signed[i],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        uploadedUserId: row.uploadedUserId,
        uploadedUser: row.uploadedUser,
        tags: row.tags,
        type: row.type,
        staticBillboardCodeId: row.staticBillboardCodeId,
        staticBillboardCode: row.staticBillboardCode,
      })),
      nextCursor,
    };
  }

  async listUploaders(): Promise<S3ImageUploader[]> {
    return this.prisma.user.findMany({
      where: { s3Images: { some: {} } },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  async create(
    dto: CreateS3ImageDto,
    uploadedUserId: string,
  ): Promise<S3ImageListItem> {
    if (!uploadedUserId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    if (dto.staticBillboardCodeId) {
      const code = await this.prisma.staticBillboardCodes.findUnique({
        where: { id: dto.staticBillboardCodeId },
        select: { id: true },
      });
      if (!code) throw new NotFoundException('Código de valla no encontrado');
    }

    const folder = STATIC_BILLBOARD_FOLDERS[dto.type] ?? 'uploads';

    const inputBuffer = decodeBase64Image(dto.imageBase64);
    const processed = await this.processor.toWebp(inputBuffer);

    const upload = await this.storage.uploadBuffer({
      buffer: processed.buffer,
      mimeType: processed.mimeType,
      extension: processed.extension,
      folder,
    });

    try {
      const created = await this.prisma.s3Image.create({
        data: {
          url: upload.key,
          deleteUrl: upload.key,
          uploadedUserId,
          tags: dto.tags ?? [],
          type: dto.type,
          staticBillboardCodeId: dto.staticBillboardCodeId ?? null,
        },
        include: {
          uploadedUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          staticBillboardCode: { select: { id: true, code: true } },
        },
      });

      const signedUrl = await this.storage.getSignedUrl(created.deleteUrl);

      return {
        id: created.id,
        url: signedUrl,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        uploadedUserId: created.uploadedUserId,
        uploadedUser: created.uploadedUser,
        tags: created.tags,
        type: created.type,
        staticBillboardCodeId: created.staticBillboardCodeId,
        staticBillboardCode: created.staticBillboardCode,
      };
    } catch (e) {
      await this.storage.deleteByKey(upload.key);
      throw e;
    }
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const image = await this.prisma.s3Image.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.prisma.s3Image.delete({ where: { id } });
    await this.storage.deleteByKey(image.deleteUrl);

    return { deleted: true };
  }
}
