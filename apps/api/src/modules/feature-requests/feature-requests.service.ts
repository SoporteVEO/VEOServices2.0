import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeatureRequestEventType, FeatureRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import type { CreateFeatureRequestDto } from './dto/feature-requests.dto.js';
import { FeatureRequestApprovalService } from './feature-request-approval.service.js';
import { FeatureRequestNotifier } from './feature-request-notifier.js';
import {
  isClosed,
  toDetail,
  toListItem,
  userFullName,
} from './feature-request.mapper.js';
import {
  DETAIL_SELECT,
  LIST_SELECT,
  USER_SELECT,
  type FeatureRequestViewer,
} from './feature-request.selects.js';
import {
  FEATURE_REQUEST_FILE_FOLDER,
  FEATURE_REQUEST_ROLES,
  MAX_FEATURE_REQUEST_FILE_BYTES,
  devRequestHref,
  formatTicketNumber,
  userRequestHref,
} from './feature-requests.constants.js';

type AccessSource = {
  requester: { id: string };
  collaborators: { userId?: string; user?: { id: string } }[];
};

export function isParticipant(row: AccessSource, userId: string): boolean {
  return (
    row.requester.id === userId ||
    row.collaborators.some((c) => (c.userId ?? c.user?.id) === userId)
  );
}

@Injectable()
export class FeatureRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly notifier: FeatureRequestNotifier,
    private readonly approval: FeatureRequestApprovalService,
  ) {}

  createUploadUrl() {
    return this.storage.getPresignedPutUrl({
      extension: 'pdf',
      mimeType: 'application/pdf',
      folder: FEATURE_REQUEST_FILE_FOLDER,
    });
  }

  listCollaboratorOptions(userId: string) {
    return this.prisma.user.findMany({
      where: {
        disabled: false,
        id: { not: userId },
        role: { in: FEATURE_REQUEST_ROLES },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: USER_SELECT,
    });
  }

  async listMine(userId: string) {
    const rows = await this.prisma.featureRequest.findMany({
      where: {
        OR: [{ requesterId: userId }, { collaborators: { some: { userId } } }],
      },
      orderBy: { number: 'desc' },
      select: LIST_SELECT,
    });
    return rows.map((row) => toListItem(row, userId));
  }

  async getDetail(id: string, viewer: FeatureRequestViewer) {
    const row = await this.prisma.featureRequest.findUnique({
      where: { id },
      select: DETAIL_SELECT,
    });
    if (!row || (!viewer.isDeveloper && !isParticipant(row, viewer.id))) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    return toDetail(row, viewer, this.storage);
  }

  async create(viewer: FeatureRequestViewer, dto: CreateFeatureRequestDto) {
    const collaboratorIds = (
      await this.resolveCollaborators(viewer.id, dto.collaboratorIds ?? [])
    ).map((user) => user.id);
    const size = await this.measureUploadedFile(dto.fileKey);

    let created: { id: string; number: number; title: string };
    try {
      created = await this.prisma.featureRequest.create({
        data: {
          title: dto.title.trim(),
          summary: dto.summary.trim(),
          priority: dto.priority,
          requesterId: viewer.id,
          fileS3Key: dto.fileKey,
          fileName: dto.fileName.trim(),
          fileSize: size,
          collaborators: {
            create: collaboratorIds.map((userId) => ({
              userId,
              addedById: viewer.id,
            })),
          },
          events: {
            create: {
              type: FeatureRequestEventType.CREATED,
              toStatus: FeatureRequestStatus.SUBMITTED,
              actorUserId: viewer.id,
            },
          },
        },
        select: { id: true, number: true, title: true },
      });
    } catch (error) {
      void this.storage.deleteByKey(dto.fileKey);
      throw error;
    }

    const ticket = formatTicketNumber(created.number);
    await Promise.all([
      this.notifier.toDevelopers(
        `Nueva solicitud de funcionalidad ${ticket}: ${created.title}`,
        devRequestHref(created.id),
        dto.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        viewer.id,
      ),
      this.notifier.toUsers(
        collaboratorIds,
        `Te agregaron como colaborador en la solicitud ${ticket}: ${created.title}`,
        userRequestHref(created.id),
      ),
    ]);

    return this.getDetail(created.id, viewer);
  }

  async addCollaborator(
    id: string,
    viewer: FeatureRequestViewer,
    targetUserId: string,
  ) {
    const row = await this.findManageable(id, viewer);
    if (
      row.requester.id === targetUserId ||
      row.collaborators.some((c) => c.userId === targetUserId)
    ) {
      throw new ConflictException('Esa persona ya participa en la solicitud');
    }

    const [target] = await this.resolveCollaborators(viewer.id, [targetUserId]);
    await this.prisma.$transaction([
      this.prisma.featureRequestCollaborator.create({
        data: { requestId: id, userId: target.id, addedById: viewer.id },
      }),
      this.prisma.featureRequestEvent.create({
        data: {
          requestId: id,
          type: FeatureRequestEventType.COLLABORATOR_ADDED,
          message: userFullName(target),
          actorUserId: viewer.id,
        },
      }),
    ]);

    const ticket = formatTicketNumber(row.number);
    await this.notifier.toUsers(
      [target.id],
      `Te agregaron como colaborador en la solicitud ${ticket}: ${row.title}`,
      userRequestHref(id),
    );
    return this.getDetail(id, viewer);
  }

  async removeCollaborator(
    id: string,
    viewer: FeatureRequestViewer,
    targetUserId: string,
  ) {
    const row = await this.findManageable(id, viewer);
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: USER_SELECT,
    });
    if (!target || !row.collaborators.some((c) => c.userId === targetUserId)) {
      throw new NotFoundException('Colaborador no encontrado');
    }

    await this.prisma.$transaction([
      this.prisma.featureRequestCollaborator.delete({
        where: {
          requestId_userId: { requestId: id, userId: targetUserId },
        },
      }),
      this.prisma.featureRequestEvent.create({
        data: {
          requestId: id,
          type: FeatureRequestEventType.COLLABORATOR_REMOVED,
          message: userFullName(target),
          actorUserId: viewer.id,
        },
      }),
    ]);

    await this.approval.settle(id);
    return this.getDetail(id, viewer);
  }

  async getAttachmentUrl(
    id: string,
    viewer: FeatureRequestViewer,
    download: boolean,
  ) {
    const row = await this.prisma.featureRequest.findUnique({
      where: { id },
      select: {
        fileS3Key: true,
        fileName: true,
        requester: { select: { id: true } },
        collaborators: { select: { userId: true } },
      },
    });
    if (!row || (!viewer.isDeveloper && !isParticipant(row, viewer.id))) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    const url = await this.storage.getSignedUrl(
      row.fileS3Key,
      undefined,
      download ? row.fileName : undefined,
    );
    return { url };
  }

  private async findManageable(id: string, viewer: FeatureRequestViewer) {
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
    if (!row || !isParticipant(row, viewer.id)) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (row.requester.id !== viewer.id) {
      throw new ForbiddenException(
        'Solo quien creó la solicitud puede gestionar a los colaboradores',
      );
    }
    if (isClosed(row.status)) {
      throw new BadRequestException(
        'La solicitud ya está cerrada y no admite cambios de colaboradores',
      );
    }
    return row;
  }

  private async resolveCollaborators(requesterId: string, ids: string[]) {
    const unique = [...new Set(ids)].filter((id) => id !== requesterId);
    const users =
      unique.length === 0
        ? []
        : await this.prisma.user.findMany({
            where: {
              id: { in: unique },
              disabled: false,
              role: { in: FEATURE_REQUEST_ROLES },
            },
            select: USER_SELECT,
          });
    if (users.length !== unique.length) {
      throw new BadRequestException('Alguno de los colaboradores no es válido');
    }
    return users;
  }

  private async measureUploadedFile(fileKey: string): Promise<number> {
    let size: number;
    try {
      size = await this.storage.getObjectSize(fileKey);
    } catch {
      throw new BadRequestException('No se encontró el PDF de la solicitud');
    }
    if (size <= 0 || size > MAX_FEATURE_REQUEST_FILE_BYTES) {
      void this.storage.deleteByKey(fileKey);
      throw new BadRequestException(
        `El PDF debe pesar menos de ${MAX_FEATURE_REQUEST_FILE_BYTES / (1024 * 1024)}MB`,
      );
    }
    return size;
  }
}
