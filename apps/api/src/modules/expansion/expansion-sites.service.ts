import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import type {
  AttachExpansionDocumentDto,
  CreateExpansionDocumentUploadDto,
  CreateExpansionSiteDto,
  UpdateExpansionSiteDto,
} from './dto/expansion.dto.js';
import {
  EXPANSION_DOCUMENT_FOLDER,
  EXPANSION_DOCUMENT_TYPES,
  MAX_EXPANSION_DOCUMENT_BYTES,
  formatSiteCode,
} from './expansion.constants.js';
import type { LocationContext } from './expansion-location-context.js';
import { ExpansionLocationService } from './expansion-location.service.js';

const PERSON_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
} as const satisfies Prisma.UserSelect;

const LIST_SELECT = {
  id: true,
  number: true,
  name: true,
  status: true,
  priority: true,
  latitude: true,
  longitude: true,
  address: true,
  departmentName: true,
  description: true,
  formatCode: true,
  width: true,
  height: true,
  estimatedMonthlyCost: true,
  estimatedMonthlyPrice: true,
  locationContext: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: PERSON_SELECT },
  _count: { select: { comments: true, documents: true } },
} as const satisfies Prisma.ExpansionSiteSelect;

const DETAIL_SELECT = {
  ...LIST_SELECT,
  comments: {
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: PERSON_SELECT },
    },
  },
  documents: {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      createdAt: true,
      uploadedBy: { select: PERSON_SELECT },
    },
  },
} as const satisfies Prisma.ExpansionSiteSelect;

type ListRow = Prisma.ExpansionSiteGetPayload<{ select: typeof LIST_SELECT }>;
type DetailRow = Prisma.ExpansionSiteGetPayload<{
  select: typeof DETAIL_SELECT;
}>;

function toListItem(row: ListRow) {
  const { _count, number, ...rest } = row;
  return {
    ...rest,
    number,
    code: formatSiteCode(number),
    commentsCount: _count.comments,
    documentsCount: _count.documents,
  };
}

function toDetail(row: DetailRow) {
  const { comments, documents, ...rest } = row;
  return { ...toListItem(rest), comments, documents };
}

function trimOrNull(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function toJson(
  context: LocationContext | null,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return context
    ? (context as unknown as Prisma.InputJsonValue)
    : Prisma.DbNull;
}

@Injectable()
export class ExpansionSitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly location: ExpansionLocationService,
  ) {}

  async list() {
    const rows = await this.prisma.expansionSite.findMany({
      orderBy: { number: 'desc' },
      select: LIST_SELECT,
    });
    return rows.map(toListItem);
  }

  async detail(id: string) {
    const row = await this.prisma.expansionSite.findUnique({
      where: { id },
      select: DETAIL_SELECT,
    });
    if (!row) throw new NotFoundException('Ubicación no encontrada');
    return toDetail(row);
  }

  async create(dto: CreateExpansionSiteDto, userId: string) {
    const context = await this.location.tryGetContext(
      dto.latitude,
      dto.longitude,
    );
    const created = await this.prisma.expansionSite.create({
      data: {
        locationContext: toJson(context),
        name: dto.name.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: dto.status,
        priority: dto.priority,
        address: trimOrNull(dto.address),
        departmentName: trimOrNull(dto.departmentName),
        description: trimOrNull(dto.description),
        formatCode: trimOrNull(dto.formatCode),
        width: dto.width ?? null,
        height: dto.height ?? null,
        estimatedMonthlyCost: dto.estimatedMonthlyCost ?? null,
        estimatedMonthlyPrice: dto.estimatedMonthlyPrice ?? null,
        createdByUserId: userId,
      },
      select: { id: true },
    });
    return this.detail(created.id);
  }

  async update(id: string, dto: UpdateExpansionSiteDto) {
    const current = await this.prisma.expansionSite.findUnique({
      where: { id },
      select: { latitude: true, longitude: true },
    });
    if (!current) throw new NotFoundException('Ubicación no encontrada');
    const data: Prisma.ExpansionSiteUpdateInput = {};
    if (dto.name != null) data.name = dto.name.trim();
    if (dto.latitude != null) data.latitude = dto.latitude;
    if (dto.longitude != null) data.longitude = dto.longitude;
    const latitude = dto.latitude ?? current.latitude;
    const longitude = dto.longitude ?? current.longitude;
    if (latitude !== current.latitude || longitude !== current.longitude) {
      data.locationContext = toJson(
        await this.location.tryGetContext(latitude, longitude),
      );
    }
    if (dto.status != null) data.status = dto.status;
    if (dto.priority != null) data.priority = dto.priority;
    if (dto.address !== undefined) data.address = trimOrNull(dto.address);
    if (dto.departmentName !== undefined)
      data.departmentName = trimOrNull(dto.departmentName);
    if (dto.description !== undefined)
      data.description = trimOrNull(dto.description);
    if (dto.formatCode !== undefined)
      data.formatCode = trimOrNull(dto.formatCode);
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.estimatedMonthlyCost !== undefined)
      data.estimatedMonthlyCost = dto.estimatedMonthlyCost;
    if (dto.estimatedMonthlyPrice !== undefined)
      data.estimatedMonthlyPrice = dto.estimatedMonthlyPrice;

    await this.prisma.expansionSite.update({ where: { id }, data });
    return this.detail(id);
  }

  async refreshContext(id: string) {
    const site = await this.prisma.expansionSite.findUnique({
      where: { id },
      select: { latitude: true, longitude: true },
    });
    if (!site) throw new NotFoundException('Ubicación no encontrada');
    const context = await this.location.tryGetContext(
      site.latitude,
      site.longitude,
      true,
    );
    if (!context) {
      throw new ServiceUnavailableException(
        'OpenStreetMap no respondió. Intenta de nuevo en unos minutos.',
      );
    }
    await this.prisma.expansionSite.update({
      where: { id },
      data: { locationContext: toJson(context) },
    });
    return this.detail(id);
  }

  async remove(id: string) {
    const site = await this.prisma.expansionSite.findUnique({
      where: { id },
      select: { documents: { select: { s3Key: true } } },
    });
    if (!site) throw new NotFoundException('Ubicación no encontrada');

    await this.prisma.expansionSite.delete({ where: { id } });
    await Promise.all(
      site.documents.map((doc) => this.storage.deleteByKey(doc.s3Key)),
    );
    return { deleted: true };
  }

  async addComment(id: string, userId: string, body: string) {
    await this.ensureExists(id);
    await this.prisma.expansionSiteComment.create({
      data: { siteId: id, body: body.trim(), authorUserId: userId },
    });
    return this.detail(id);
  }

  async createDocumentUploadUrl(
    id: string,
    dto: CreateExpansionDocumentUploadDto,
  ) {
    await this.ensureExists(id);
    return this.storage.getPresignedPutUrl({
      extension: EXPANSION_DOCUMENT_TYPES[dto.mimeType],
      mimeType: dto.mimeType,
      folder: EXPANSION_DOCUMENT_FOLDER,
    });
  }

  async attachDocument(
    id: string,
    userId: string,
    dto: AttachExpansionDocumentDto,
  ) {
    await this.ensureExists(id);
    if (!dto.fileKey.endsWith(`.${EXPANSION_DOCUMENT_TYPES[dto.mimeType]}`)) {
      throw new BadRequestException('El archivo no coincide con su tipo');
    }

    let size: number;
    try {
      size = await this.storage.getObjectSize(dto.fileKey);
    } catch {
      throw new BadRequestException('No se encontró el archivo subido');
    }
    if (size <= 0 || size > MAX_EXPANSION_DOCUMENT_BYTES) {
      void this.storage.deleteByKey(dto.fileKey);
      throw new BadRequestException(
        `El archivo debe pesar menos de ${MAX_EXPANSION_DOCUMENT_BYTES / (1024 * 1024)}MB`,
      );
    }

    try {
      await this.prisma.expansionSiteDocument.create({
        data: {
          siteId: id,
          s3Key: dto.fileKey,
          fileName: dto.fileName.trim(),
          mimeType: dto.mimeType,
          fileSize: size,
          uploadedByUserId: userId,
        },
      });
    } catch (error) {
      void this.storage.deleteByKey(dto.fileKey);
      throw error;
    }
    return this.detail(id);
  }

  async getDocumentUrl(documentId: string, download: boolean) {
    const doc = await this.prisma.expansionSiteDocument.findUnique({
      where: { id: documentId },
      select: { s3Key: true, fileName: true },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    const url = await this.storage.getSignedUrl(
      doc.s3Key,
      undefined,
      download ? doc.fileName : undefined,
    );
    return { url };
  }

  async removeDocument(documentId: string) {
    const doc = await this.prisma.expansionSiteDocument.findUnique({
      where: { id: documentId },
      select: { siteId: true, s3Key: true },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');

    await this.prisma.expansionSiteDocument.delete({
      where: { id: documentId },
    });
    await this.storage.deleteByKey(doc.s3Key);
    return this.detail(doc.siteId);
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.expansionSite.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Ubicación no encontrada');
  }
}
