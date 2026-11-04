import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FeatureRequestEventType,
  FeatureRequestStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import type {
  ListFeatureRequestsQueryDto,
  UpdateFeatureRequestDto,
  UpdateFeatureRequestStatusDto,
} from './dto/feature-requests.dto.js';
import { FeatureRequestNotifier } from './feature-request-notifier.js';
import { toListItem } from './feature-request.mapper.js';
import {
  LIST_SELECT,
  type FeatureRequestViewer,
} from './feature-request.selects.js';
import {
  MAX_ATTACHMENTS,
  STATUS_LABELS,
  formatTicketNumber,
  parseTicketNumber,
  userRequestHref,
} from './feature-requests.constants.js';
import { FeatureRequestsService } from './feature-requests.service.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function buildSearchWhere(
  search: string | undefined,
): Prisma.FeatureRequestWhereInput {
  const term = search?.trim();
  if (!term) return {};
  const number = parseTicketNumber(term);
  return {
    OR: [
      ...(number !== undefined ? [{ number }] : []),
      { title: { contains: term, mode: 'insensitive' } },
      { summary: { contains: term, mode: 'insensitive' } },
      { requester: { firstName: { contains: term, mode: 'insensitive' } } },
      { requester: { lastName: { contains: term, mode: 'insensitive' } } },
      { requester: { email: { contains: term, mode: 'insensitive' } } },
    ],
  };
}

@Injectable()
export class FeatureRequestsDevService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: FeatureRequestNotifier,
    private readonly requests: FeatureRequestsService,
    private readonly storage: S3StorageService,
  ) {}

  async list(query: ListFeatureRequestsQueryDto, viewerId: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Number(query.pageSize) || DEFAULT_PAGE_SIZE,
    );
    const filters: Prisma.FeatureRequestWhereInput = {
      ...(query.priority ? { priority: query.priority } : {}),
      ...buildSearchWhere(query.search),
    };
    const where: Prisma.FeatureRequestWhereInput = {
      ...filters,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, total, byStatus] = await Promise.all([
      this.prisma.featureRequest.findMany({
        where,
        orderBy: { number: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: LIST_SELECT,
      }),
      this.prisma.featureRequest.count({ where }),
      this.prisma.featureRequest.groupBy({
        by: ['status'],
        where: filters,
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(
      Object.values(FeatureRequestStatus).map((status) => [
        status,
        byStatus.find((g) => g.status === status)?._count._all ?? 0,
      ]),
    ) as Record<FeatureRequestStatus, number>;

    return {
      data: rows.map((row) => toListItem(row, viewerId)),
      total,
      page,
      pageSize,
      counts,
    };
  }

  async update(
    id: string,
    dto: UpdateFeatureRequestDto,
    viewer: FeatureRequestViewer,
  ) {
    const row = await this.prisma.featureRequest.findUnique({
      where: { id },
      select: {
        title: true,
        summary: true,
        priority: true,
        fileS3Key: true,
        attachments: { select: { id: true, s3Key: true } },
      },
    });
    if (!row) throw new NotFoundException('Solicitud no encontrada');
    if ((dto.fileKey === undefined) !== (dto.fileName === undefined)) {
      throw new BadRequestException('Falta el nombre o la clave del archivo');
    }

    const removeIds = new Set(dto.removeAttachmentIds ?? []);
    const removed = row.attachments.filter((item) => removeIds.has(item.id));
    if (removed.length !== removeIds.size) {
      throw new BadRequestException('Alguno de los archivos ya no existe');
    }
    const added = dto.attachments ?? [];
    const addedKeys = added.map((item) => item.key);
    if (new Set(addedKeys).size !== addedKeys.length) {
      throw new BadRequestException('Hay archivos adjuntos repetidos');
    }
    if (
      row.attachments.length - removed.length + added.length >
      MAX_ATTACHMENTS
    ) {
      throw new BadRequestException(
        `Solo se admiten ${MAX_ATTACHMENTS} archivos adicionales`,
      );
    }

    const data: Prisma.FeatureRequestUpdateInput = {};
    const changes: string[] = [];
    const title = dto.title?.trim();
    const summary = dto.summary?.trim();
    if (title !== undefined && title !== row.title) {
      data.title = title;
      changes.push('título');
    }
    if (summary !== undefined && summary !== row.summary) {
      data.summary = summary;
      changes.push('descripción');
    }
    if (dto.priority !== undefined && dto.priority !== row.priority) {
      data.priority = dto.priority;
      changes.push('prioridad');
    }
    const replacedKey =
      dto.fileKey !== undefined && dto.fileKey !== row.fileS3Key
        ? dto.fileKey
        : undefined;
    const uploadedKeys = [
      ...(replacedKey !== undefined ? [replacedKey] : []),
      ...addedKeys,
    ];
    const discardUploads = () =>
      uploadedKeys.forEach((key) => void this.storage.deleteByKey(key));

    if (removed.length > 0 || added.length > 0 || replacedKey !== undefined) {
      try {
        if (replacedKey !== undefined && dto.fileName !== undefined) {
          data.fileS3Key = replacedKey;
          data.fileName = dto.fileName.trim();
          data.fileSize = await this.requests.measureUploadedFile(replacedKey);
          changes.push('archivo PDF');
        }
        if (removed.length > 0 || added.length > 0) {
          const sizes = await Promise.all(
            addedKeys.map((key) =>
              this.requests.measureUploadedFile(key, 'archivo adjunto'),
            ),
          );
          data.attachments = {
            ...(removed.length > 0
              ? { deleteMany: { id: { in: removed.map((item) => item.id) } } }
              : {}),
            ...(added.length > 0
              ? {
                  create: added.map((item, index) => ({
                    s3Key: item.key,
                    fileName: item.fileName.trim(),
                    fileSize: sizes[index],
                  })),
                }
              : {}),
          };
          changes.push('archivos adicionales');
        }
      } catch (error) {
        discardUploads();
        throw error;
      }
    }

    if (changes.length === 0) {
      throw new BadRequestException('No hay cambios que guardar');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.featureRequest.update({ where: { id }, data });
        await tx.featureRequestEvent.create({
          data: {
            requestId: id,
            type: FeatureRequestEventType.EDITED,
            message: changes.join(', '),
            actorUserId: viewer.id,
          },
        });
      });
    } catch (error) {
      discardUploads();
      throw error;
    }
    if (replacedKey) void this.storage.deleteByKey(row.fileS3Key);
    removed.forEach((item) => void this.storage.deleteByKey(item.s3Key));

    return this.requests.getDetail(id, viewer);
  }

  async updateStatus(
    id: string,
    dto: UpdateFeatureRequestStatusDto,
    viewer: FeatureRequestViewer,
  ) {
    const row = await this.prisma.featureRequest.findUnique({
      where: { id },
      select: {
        number: true,
        title: true,
        status: true,
        requester: { select: { id: true } },
        collaborators: { select: { userId: true } },
      },
    });
    if (!row) throw new NotFoundException('Solicitud no encontrada');
    if (row.status === FeatureRequestStatus.APPROVED) {
      throw new BadRequestException(
        'La solicitud ya fue aprobada y no admite cambios',
      );
    }

    const message = dto.message?.trim() || undefined;
    if (dto.status === FeatureRequestStatus.REJECTED && !message) {
      throw new BadRequestException('Explica el motivo del rechazo');
    }
    const unchanged = dto.status === row.status;
    if (unchanged && !message) {
      throw new BadRequestException('La solicitud ya tiene ese estado');
    }

    const completing =
      !unchanged && dto.status === FeatureRequestStatus.COMPLETED;
    await this.prisma.$transaction(async (tx) => {
      if (!unchanged) {
        await tx.featureRequest.update({
          where: { id },
          data: {
            status: dto.status,
            completedAt: completing ? new Date() : null,
            ...(completing ? { completionRound: { increment: 1 } } : {}),
          },
        });
      }
      await tx.featureRequestEvent.create({
        data: {
          requestId: id,
          type: unchanged
            ? FeatureRequestEventType.COMMENT
            : FeatureRequestEventType.STATUS_CHANGED,
          fromStatus: unchanged ? null : row.status,
          toStatus: unchanged ? null : dto.status,
          message,
          actorUserId: viewer.id,
        },
      });
    });

    const ticket = formatTicketNumber(row.number);
    const recipients = [
      row.requester.id,
      ...row.collaborators.map((c) => c.userId),
    ].filter((userId) => userId !== viewer.id);
    const note = message ? `: ${message}` : '';
    const description = completing
      ? `${ticket} está completada. Revisa la funcionalidad y firma tu aprobación.`
      : unchanged
        ? `El equipo de desarrollo comentó en ${ticket}${note}`
        : `${ticket} cambió a «${STATUS_LABELS[dto.status]}»${note}`;
    const urgent = completing || dto.status === FeatureRequestStatus.REJECTED;
    await this.notifier.toUsers(
      recipients,
      description,
      userRequestHref(id),
      urgent ? 'HIGH' : 'MEDIUM',
    );

    return this.requests.getDetail(id, viewer);
  }
}
