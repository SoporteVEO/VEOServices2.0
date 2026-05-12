import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../email/email.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ImageProcessorService } from '../s3-images/image-processor.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import {
  buildEmployeeAbsenceConfirmationEmail,
  buildHrAbsenceEmail,
} from './absence-emails.js';
import { buildAbsencePdf, type AbsencePdfImage } from './absence-pdf.js';
import { CreateAbsenceDto } from './dto/create-absence.dto.js';
import { UpdateAbsenceDto } from './dto/update-absence.dto.js';

const ABSENCE_FOLDER = 'absence';

const ABSENCE_SELECT = {
  id: true,
  userId: true,
  fromDate: true,
  toDate: true,
  reason: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: { id: true, url: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} as const;

type AbsenceRow = {
  id: string;
  userId: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  images: { id: string; url: string; createdAt: Date }[];
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
};

function decodeBase64Image(base64: string): Buffer {
  const normalized = base64.includes(',') ? base64.split(',')[1] : base64;
  if (!normalized) {
    throw new BadRequestException('La imagen está vacía o es inválida');
  }
  return Buffer.from(normalized, 'base64');
}

function buildAbsencePdfFileName(fullName: string, fromDate: Date): string {
  const datePart = fromDate.toISOString().slice(0, 10);
  const slug = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `incapacidad-${slug || 'empleado'}-${datePart}.pdf`;
}

function formatAbsenceUserFullName(user: AbsenceRow['user']): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Sin nombre'
  );
}

@Injectable()
export class AbsencesService {
  private readonly logger = new Logger(AbsencesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly processor: ImageProcessorService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  private async serialize(absence: AbsenceRow) {
    const signedImages = await Promise.all(
      absence.images.map(async (img) => ({
        id: img.id,
        url: await this.storage.getSignedUrl(img.url),
        createdAt: img.createdAt.toISOString(),
      })),
    );

    return {
      id: absence.id,
      userId: absence.userId,
      fromDate: absence.fromDate.toISOString(),
      toDate: absence.toDate.toISOString(),
      reason: absence.reason,
      status: absence.status,
      createdAt: absence.createdAt.toISOString(),
      updatedAt: absence.updatedAt.toISOString(),
      images: signedImages,
      user: absence.user,
    };
  }

  async create(userId: string, dto: CreateAbsenceDto) {
    const fromDate = new Date(dto.fromDate);
    const toDate = new Date(dto.toDate);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }
    if (toDate < fromDate) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior o igual a la fecha de inicio',
      );
    }

    const uploadedKeys: string[] = [];

    try {
      for (const base64 of dto.images ?? []) {
        const buffer = decodeBase64Image(base64);
        const processed = await this.processor.toWebp(buffer);
        const upload = await this.storage.uploadBuffer({
          buffer: processed.buffer,
          mimeType: processed.mimeType,
          extension: processed.extension,
          folder: ABSENCE_FOLDER,
        });
        uploadedKeys.push(upload.key);
      }

      const created = await this.prisma.absence.create({
        data: {
          userId,
          fromDate,
          toDate,
          reason: dto.reason,
          images: uploadedKeys.length
            ? { create: uploadedKeys.map((url) => ({ url })) }
            : undefined,
        },
        select: ABSENCE_SELECT,
      });

      await this.createHrNotifications(created as AbsenceRow);

      this.dispatchAbsenceEmails(created as AbsenceRow).catch((err) => {
        this.logger.error(
          `Unexpected error sending absence emails for ${created.id}: ${(err as Error).message}`,
        );
      });

      return this.serialize(created as AbsenceRow);
    } catch (err) {
      await Promise.all(uploadedKeys.map((k) => this.storage.deleteByKey(k)));
      throw err;
    }
  }

  private async createHrNotifications(absence: AbsenceRow) {
    const fullName = formatAbsenceUserFullName(absence.user);
    try {
      const result = await this.notifications.createForSubRole(
        'HR',
        `${fullName} ha enviado una nueva solicitud de incapacidad`,
        'HIGH',
      );
      this.logger.log(
        `Created ${result.count} HR notification(s) for absence ${absence.id}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to create HR notifications for absence ${absence.id}: ${(err as Error).message}`,
      );
    }
  }

  private async dispatchAbsenceEmails(absence: AbsenceRow) {
    const fullName = formatAbsenceUserFullName(absence.user);

    const [hrUsers, requester, pdfImages] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          disabled: false,
          subRoles: { has: 'HR' },
          id: { not: absence.userId },
        },
        select: {
          id: true,
          email: true,
          teamMember: { select: { businessEmail: true } },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: absence.userId },
        select: {
          email: true,
          teamMember: { select: { businessEmail: true } },
        },
      }),
      this.loadAbsencePdfImages(absence),
    ]);

    const requesterEmail =
      requester?.teamMember?.businessEmail ??
      requester?.email ??
      absence.user.email;

    const pdfBuffer = await buildAbsencePdf({
      absence: {
        id: absence.id,
        userId: absence.userId,
        fromDate: absence.fromDate.toISOString(),
        toDate: absence.toDate.toISOString(),
        reason: absence.reason,
        status: absence.status,
        createdAt: absence.createdAt.toISOString(),
        updatedAt: absence.updatedAt.toISOString(),
        user: {
          id: absence.user.id,
          firstName: absence.user.firstName,
          lastName: absence.user.lastName,
          email: requesterEmail,
        },
        images: absence.images.map((img) => ({
          id: img.id,
          url: img.url,
          createdAt: img.createdAt.toISOString(),
        })),
      },
      images: pdfImages,
    });
    const pdfFileName = buildAbsencePdfFileName(fullName, absence.fromDate);

    const emailData = {
      id: absence.id,
      fromDate: absence.fromDate,
      toDate: absence.toDate,
      reason: absence.reason,
      createdAt: absence.createdAt,
      user: {
        firstName: absence.user.firstName,
        lastName: absence.user.lastName,
        email: requesterEmail,
      },
      imagesCount: absence.images.length,
    };

    const hrRecipients = hrUsers
      .map((u) => u.teamMember?.businessEmail ?? u.email)
      .filter((email): email is string => Boolean(email));

    if (hrRecipients.length > 0) {
      const hrEmail = buildHrAbsenceEmail(emailData);
      await Promise.all(
        hrRecipients.map((email) =>
          this.email.sendEmail(email, hrEmail.subject, hrEmail.html, [
            {
              filename: pdfFileName,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ]),
        ),
      );
      this.logger.log(
        `Sent absence email to ${hrRecipients.length} HR recipient(s) for absence ${absence.id}`,
      );
    }

    const employeeEmail = buildEmployeeAbsenceConfirmationEmail(emailData);
    await this.email.sendEmail(
      requesterEmail,
      employeeEmail.subject,
      employeeEmail.html,
      [
        {
          filename: pdfFileName,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    );
    this.logger.log(
      `Sent confirmation email to ${requesterEmail} for absence ${absence.id}`,
    );
  }

  private async loadAbsencePdfImages(
    absence: AbsenceRow,
  ): Promise<AbsencePdfImage[]> {
    if (absence.images.length === 0) return [];

    const results: (AbsencePdfImage | null)[] = await Promise.all(
      absence.images.map(async (img): Promise<AbsencePdfImage | null> => {
        try {
          const buffer = await this.storage.getObjectBuffer(img.url);
          const png = await this.processor.toPng(buffer);
          return {
            id: img.id,
            createdAt: img.createdAt.toISOString(),
            src: { data: png.buffer, format: 'png' },
          };
        } catch (err) {
          this.logger.warn(
            `Failed to load absence image ${img.id} for PDF: ${(err as Error).message}`,
          );
          return null;
        }
      }),
    );

    return results.filter((r): r is AbsencePdfImage => r !== null);
  }

  async findMine(userId: string) {
    const rows = await this.prisma.absence.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: ABSENCE_SELECT,
    });
    return Promise.all(rows.map((row) => this.serialize(row as AbsenceRow)));
  }

  async findAll() {
    const rows = await this.prisma.absence.findMany({
      orderBy: { createdAt: 'desc' },
      select: ABSENCE_SELECT,
    });
    return Promise.all(rows.map((row) => this.serialize(row as AbsenceRow)));
  }

  async updateMine(userId: string, id: string, dto: UpdateAbsenceDto) {
    const existing = await this.prisma.absence.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        fromDate: true,
        toDate: true,
        images: { select: { id: true, url: true } },
      },
    });
    if (!existing) throw new NotFoundException('Incapacidad no encontrada');
    if (existing.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para editar esta incapacidad',
      );
    }

    const nextFromDate =
      dto.fromDate !== undefined ? new Date(dto.fromDate) : existing.fromDate;
    const nextToDate =
      dto.toDate !== undefined ? new Date(dto.toDate) : existing.toDate;

    if (
      (dto.fromDate !== undefined && isNaN(nextFromDate.getTime())) ||
      (dto.toDate !== undefined && isNaN(nextToDate.getTime()))
    ) {
      throw new BadRequestException('Fechas inválidas');
    }
    if (nextToDate < nextFromDate) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior o igual a la fecha de inicio',
      );
    }

    const removedIds = (dto.removedImageIds ?? []).filter((rid) =>
      existing.images.some((img) => img.id === rid),
    );
    const removedKeys = existing.images
      .filter((img) => removedIds.includes(img.id))
      .map((img) => img.url);

    const uploadedKeys: string[] = [];
    try {
      for (const base64 of dto.addedImages ?? []) {
        const buffer = decodeBase64Image(base64);
        const processed = await this.processor.toWebp(buffer);
        const upload = await this.storage.uploadBuffer({
          buffer: processed.buffer,
          mimeType: processed.mimeType,
          extension: processed.extension,
          folder: ABSENCE_FOLDER,
        });
        uploadedKeys.push(upload.key);
      }

      await this.prisma.$transaction(async (tx) => {
        if (removedIds.length) {
          await tx.absenceImage.deleteMany({
            where: { id: { in: removedIds }, absenceId: id },
          });
        }
        if (uploadedKeys.length) {
          await tx.absenceImage.createMany({
            data: uploadedKeys.map((url) => ({ absenceId: id, url })),
          });
        }
        await tx.absence.update({
          where: { id },
          data: {
            ...(dto.fromDate !== undefined ? { fromDate: nextFromDate } : {}),
            ...(dto.toDate !== undefined ? { toDate: nextToDate } : {}),
            ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
          },
        });
      });

      await Promise.all(removedKeys.map((k) => this.storage.deleteByKey(k)));

      const updated = await this.prisma.absence.findUnique({
        where: { id },
        select: ABSENCE_SELECT,
      });
      return this.serialize(updated as AbsenceRow);
    } catch (err) {
      await Promise.all(uploadedKeys.map((k) => this.storage.deleteByKey(k)));
      throw err;
    }
  }

  async updateStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const existing = await this.prisma.absence.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Incapacidad no encontrada');

    await this.prisma.absence.update({
      where: { id },
      data: { status },
    });

    const updated = await this.prisma.absence.findUnique({
      where: { id },
      select: ABSENCE_SELECT,
    });
    return this.serialize(updated as AbsenceRow);
  }

  async removeMine(userId: string, id: string) {
    const absence = await this.prisma.absence.findUnique({
      where: { id },
      select: { id: true, userId: true, images: { select: { url: true } } },
    });
    if (!absence) throw new NotFoundException('Incapacidad no encontrada');
    if (absence.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta incapacidad',
      );
    }

    await this.prisma.absence.delete({ where: { id } });
    await Promise.all(
      absence.images.map((img) => this.storage.deleteByKey(img.url)),
    );
    return { deleted: true };
  }
}
