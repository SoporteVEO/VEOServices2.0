import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FeatureRequestEventType,
  FeatureRequestStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import type {
  ReportProblemDto,
  SignFeatureRequestDto,
} from './dto/feature-requests.dto.js';
import { FeatureRequestApprovalService } from './feature-request-approval.service.js';
import { FeatureRequestNotifier } from './feature-request-notifier.js';
import { signatureProgress, userFullName } from './feature-request.mapper.js';
import {
  USER_SELECT,
  type FeatureRequestViewer,
} from './feature-request.selects.js';
import {
  FEATURE_REQUEST_SIGNATURE_FOLDER,
  MAX_SIGNATURE_BYTES,
  devRequestHref,
  formatTicketNumber,
  userRequestHref,
} from './feature-requests.constants.js';
import {
  FeatureRequestsService,
  isParticipant,
} from './feature-requests.service.js';

const PNG_DATA_URL = /^data:image\/png;base64,/;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface SignatureContext {
  ipAddress?: string;
  userAgent?: string;
}

function decodeSignature(value: string): Buffer {
  if (!PNG_DATA_URL.test(value)) {
    throw new BadRequestException('La firma debe ser una imagen PNG');
  }
  const buffer = Buffer.from(value.replace(PNG_DATA_URL, ''), 'base64');
  if (
    buffer.length <= PNG_MAGIC.length ||
    !buffer.subarray(0, 8).equals(PNG_MAGIC)
  ) {
    throw new BadRequestException('La firma no es una imagen válida');
  }
  if (buffer.length > MAX_SIGNATURE_BYTES) {
    throw new BadRequestException('La firma es demasiado pesada');
  }
  return buffer;
}

@Injectable()
export class FeatureRequestSignaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly notifier: FeatureRequestNotifier,
    private readonly approval: FeatureRequestApprovalService,
    private readonly requests: FeatureRequestsService,
  ) {}

  async sign(
    id: string,
    viewer: FeatureRequestViewer,
    dto: SignFeatureRequestDto,
    context: SignatureContext,
  ) {
    const row = await this.findAwaitingParticipant(id, viewer);
    if (signatureProgress(row).signedIds.has(viewer.id)) {
      throw new ConflictException('Ya firmaste esta entrega');
    }

    const signer = await this.prisma.user.findUniqueOrThrow({
      where: { id: viewer.id },
      select: USER_SELECT,
    });
    const upload = await this.storage.uploadBuffer({
      buffer: decodeSignature(dto.signatureImage),
      mimeType: 'image/png',
      extension: 'png',
      folder: FEATURE_REQUEST_SIGNATURE_FOLDER,
    });

    try {
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.featureRequest.findUnique({
          where: { id },
          select: { status: true, completionRound: true },
        });
        if (
          current?.status !== FeatureRequestStatus.COMPLETED ||
          current.completionRound !== row.completionRound
        ) {
          throw new BadRequestException(
            'La solicitud cambió mientras firmabas. Revísala de nuevo.',
          );
        }
        await tx.featureRequestSignature.create({
          data: {
            requestId: id,
            userId: viewer.id,
            round: row.completionRound,
            signerName: userFullName(signer),
            signerEmail: signer.email,
            imageS3Key: upload.key,
            ipAddress: context.ipAddress?.slice(0, 64),
            userAgent: context.userAgent?.slice(0, 512),
          },
        });
        await tx.featureRequestEvent.create({
          data: {
            requestId: id,
            type: FeatureRequestEventType.SIGNED,
            message: userFullName(signer),
            actorUserId: viewer.id,
          },
        });
      });
    } catch (error) {
      await this.storage.deleteByKey(upload.key);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya firmaste esta entrega');
      }
      throw error;
    }

    await this.approval.settle(id);
    return this.requests.getDetail(id, viewer);
  }

  async reportProblem(
    id: string,
    viewer: FeatureRequestViewer,
    dto: ReportProblemDto,
  ) {
    const row = await this.findAwaitingParticipant(id, viewer);
    if (signatureProgress(row).signedIds.has(viewer.id)) {
      throw new ConflictException(
        'Ya firmaste esta entrega y no puedes reportar problemas',
      );
    }

    const reporter = await this.prisma.user.findUniqueOrThrow({
      where: { id: viewer.id },
      select: USER_SELECT,
    });

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.featureRequest.updateMany({
        where: { id, status: FeatureRequestStatus.COMPLETED },
        data: { status: FeatureRequestStatus.IN_PROGRESS, completedAt: null },
      });
      if (updated.count === 0) {
        throw new BadRequestException(
          'La solicitud ya no está pendiente de aprobación',
        );
      }
      await tx.featureRequestEvent.create({
        data: {
          requestId: id,
          type: FeatureRequestEventType.PROBLEM_REPORTED,
          fromStatus: FeatureRequestStatus.COMPLETED,
          toStatus: FeatureRequestStatus.IN_PROGRESS,
          message: dto.message.trim(),
          actorUserId: viewer.id,
        },
      });
    });

    const ticket = formatTicketNumber(row.number);
    const others = [
      row.requester.id,
      ...row.collaborators.map((c) => c.userId),
    ].filter((userId) => userId !== viewer.id);
    await Promise.all([
      this.notifier.toDevelopers(
        `${userFullName(reporter)} reportó un problema en ${ticket}: ${row.title}`,
        devRequestHref(id),
        'HIGH',
      ),
      this.notifier.toUsers(
        others,
        `${userFullName(reporter)} reportó un problema en ${ticket}. Volvió a desarrollo.`,
        userRequestHref(id),
      ),
    ]);

    return this.requests.getDetail(id, viewer);
  }

  private async findAwaitingParticipant(
    id: string,
    viewer: FeatureRequestViewer,
  ) {
    const row = await this.prisma.featureRequest.findUnique({
      where: { id },
      select: {
        number: true,
        title: true,
        status: true,
        completionRound: true,
        requester: { select: { id: true } },
        collaborators: { select: { userId: true } },
        signatures: { select: { userId: true, round: true } },
      },
    });
    if (!row || !isParticipant(row, viewer.id)) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (row.status !== FeatureRequestStatus.COMPLETED) {
      throw new BadRequestException(
        'Esta solicitud no está pendiente de tu aprobación',
      );
    }
    return row;
  }
}
