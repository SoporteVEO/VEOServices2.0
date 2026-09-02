import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  MaintenanceEventType,
  MaintenanceJobStatus,
  Prisma,
  S3ImageType,
} from '@prisma/client';
import { BillboardsService } from '../billboards/billboards.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ImageProcessorService } from '../s3-images/image-processor.service.js';
import { S3ImagesService } from '../s3-images/s3-images.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import type {
  CompleteMaintenanceJobDto,
  CreateMaintenanceJobDto,
  ListMaintenanceJobsQueryDto,
  UpdateMaintenanceJobDto,
  UploadMaintenancePhotoDto,
} from './dto/maintenance-job.dto.js';

const PHOTO_FOLDER = 'maintenance/proof';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface MaintenancePersonDto {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export interface MaintenancePhotoDto {
  id: string;
  url: string;
  note: string | null;
  uploadedBy: MaintenancePersonDto | null;
  createdAt: string;
  /** Id of the copy published to the Imágenes module, if it was published. */
  publishedImageId: string | null;
}

export interface MaintenanceEventDto {
  id: string;
  type: MaintenanceEventType;
  message: string | null;
  actor: MaintenancePersonDto | null;
  createdAt: string;
}

export interface MaintenanceJobListItemDto {
  id: string;
  code: string;
  status: MaintenanceJobStatus;
  billboardId: number | null;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  description: string;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  category: { id: string; name: string; color: string | null } | null;
  assignedUser: MaintenancePersonDto;
  photoCount: number;
  createdAt: string;
  isOverdue: boolean;
}

export interface MaintenanceJobDto extends MaintenanceJobListItemDto {
  width: number | null;
  height: number | null;
  latitude: number | null;
  longitude: number | null;
  reference: string | null;
  cancelledAt: string | null;
  completionNotes: string | null;
  createdBy: MaintenancePersonDto | null;
  photos: MaintenancePhotoDto[];
  events: MaintenanceEventDto[];
  /** Derived durations, in minutes, for the Historial tab. */
  minutesToStart: number | null;
  minutesWorked: number | null;
}

const PERSON_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const LIST_INCLUDE = {
  assignedUser: { select: PERSON_SELECT },
  category: { select: { id: true, name: true, color: true } },
  _count: { select: { photos: true } },
} satisfies Prisma.MaintenanceJobInclude;

const DETAIL_INCLUDE = {
  ...LIST_INCLUDE,
  createdBy: { select: PERSON_SELECT },
  photos: {
    select: {
      id: true,
      s3Key: true,
      note: true,
      createdAt: true,
      s3ImageId: true,
      uploadedBy: { select: PERSON_SELECT },
    },
    orderBy: [{ createdAt: 'desc' }],
  },
  events: {
    select: {
      id: true,
      type: true,
      message: true,
      createdAt: true,
      actor: { select: PERSON_SELECT },
    },
    orderBy: [{ createdAt: 'asc' }],
  },
} satisfies Prisma.MaintenanceJobInclude;

type ListRow = Prisma.MaintenanceJobGetPayload<{
  include: typeof LIST_INCLUDE;
}>;
type DetailRow = Prisma.MaintenanceJobGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

function decodeBase64Image(base64: string): Buffer {
  const normalized = base64.includes(',') ? base64.split(',')[1] : base64;
  if (!normalized) {
    throw new BadRequestException('La imagen está vacía o es inválida');
  }
  return Buffer.from(normalized, 'base64');
}

function minutesBetween(from: Date | null, to: Date | null): number | null {
  if (!from || !to) return null;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
}

/**
 * Maintenance work orders: assignment from the dashboard module, execution
 * from the technician's mobile portal. Every state change appends a
 * `MaintenanceEvent` so the Historial tab and the module's stats can be
 * rebuilt from the trail rather than inferred from timestamps alone.
 */
@Injectable()
export class MaintenanceJobsService {
  private readonly logger = new Logger(MaintenanceJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly processor: ImageProcessorService,
    private readonly billboards: BillboardsService,
    private readonly s3Images: S3ImagesService,
  ) {}

  async list(query: ListMaintenanceJobsQueryDto): Promise<{
    data: MaintenanceJobListItemDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, Number(query.page ?? '1') || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(
        1,
        Number(query.pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE,
      ),
    );

    const where = this.buildWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.maintenanceJob.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.maintenanceJob.count({ where }),
    ]);

    return { data: rows.map(mapListItem), total, page, pageSize };
  }

  /** Users who can receive a work order, i.e. hold the MANTENIMIENTO role. */
  async listTechnicians(): Promise<MaintenancePersonDto[]> {
    return this.prisma.user.findMany({
      where: { disabled: false, role: 'MANTENIMIENTO' },
      select: PERSON_SELECT,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  /** Jobs assigned to the signed-in technician, soonest first. */
  async listAssignedTo(userId: string): Promise<MaintenanceJobListItemDto[]> {
    const rows = await this.prisma.maintenanceJob.findMany({
      where: {
        assignedUserId: userId,
        status: { not: MaintenanceJobStatus.CANCELLED },
      },
      include: LIST_INCLUDE,
      orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }],
    });
    return rows.map(mapListItem);
  }

  async getJob(id: string): Promise<MaintenanceJobDto> {
    const row = await this.prisma.maintenanceJob.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!row)
      throw new NotFoundException('Orden de mantenimiento no encontrada');
    return this.mapDetail(row);
  }

  /** Portal variant: a technician may only open their own jobs. */
  async getJobForCaller(
    id: string,
    userId: string,
  ): Promise<MaintenanceJobDto> {
    await this.findOwnedJob(id, userId);
    return this.getJob(id);
  }

  async create(
    dto: CreateMaintenanceJobDto,
    createdByUserId: string,
  ): Promise<MaintenanceJobDto> {
    const assignee = await this.prisma.user.findUnique({
      where: { id: dto.assignedUserId },
      select: { id: true, role: true, disabled: true },
    });
    if (!assignee || assignee.disabled) {
      throw new BadRequestException('El usuario asignado no está disponible');
    }
    if (assignee.role !== 'MANTENIMIENTO') {
      throw new BadRequestException(
        'Solo puedes asignar órdenes a usuarios con rol Mantenimiento',
      );
    }

    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('La fecha programada no es válida');
    }

    const code = await this.generateJobCode();

    const created = await this.prisma.maintenanceJob.create({
      data: {
        code,
        billboardId: dto.billboardId,
        billboardCode: dto.billboardCode?.trim() || null,
        address: dto.address?.trim() || null,
        cityName: dto.cityName?.trim() || null,
        departmentName: dto.departmentName?.trim() || null,
        width: dto.width ?? null,
        height: dto.height ?? null,
        categoryId: dto.categoryId ?? null,
        assignedUserId: dto.assignedUserId,
        description: dto.description.trim(),
        scheduledAt,
        createdByUserId,
        events: {
          create: {
            type: MaintenanceEventType.CREATED,
            message: `Orden ${code} creada y asignada`,
            actorUserId: createdByUserId,
          },
        },
      },
      include: DETAIL_INCLUDE,
    });

    return this.mapDetail(created);
  }

  async update(
    id: string,
    dto: UpdateMaintenanceJobDto,
    actorUserId: string,
  ): Promise<MaintenanceJobDto> {
    const current = await this.prisma.maintenanceJob.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        status: true,
        assignedUserId: true,
        scheduledAt: true,
        description: true,
        categoryId: true,
      },
    });
    if (!current) {
      throw new NotFoundException('Orden de mantenimiento no encontrada');
    }

    const data: Prisma.MaintenanceJobUpdateInput = {};
    const events: {
      type: MaintenanceEventType;
      message: string;
    }[] = [];

    if (dto.assignedUserId && dto.assignedUserId !== current.assignedUserId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: dto.assignedUserId },
        select: {
          id: true,
          role: true,
          disabled: true,
          firstName: true,
          lastName: true,
        },
      });
      if (!assignee || assignee.disabled || assignee.role !== 'MANTENIMIENTO') {
        throw new BadRequestException(
          'Solo puedes asignar órdenes a usuarios con rol Mantenimiento',
        );
      }
      data.assignedUser = { connect: { id: dto.assignedUserId } };
      events.push({
        type: MaintenanceEventType.REASSIGNED,
        message: `Reasignada a ${[assignee.firstName, assignee.lastName].filter(Boolean).join(' ')}`,
      });
    }

    if (dto.scheduledAt) {
      const next = new Date(dto.scheduledAt);
      if (Number.isNaN(next.getTime())) {
        throw new BadRequestException('La fecha programada no es válida');
      }
      if (next.getTime() !== current.scheduledAt.getTime()) {
        data.scheduledAt = next;
        events.push({
          type: MaintenanceEventType.RESCHEDULED,
          message: `Reprogramada para ${next.toISOString()}`,
        });
      }
    }

    if (dto.description !== undefined) {
      const description = dto.description.trim();
      if (description !== current.description) {
        data.description = description;
        events.push({
          type: MaintenanceEventType.UPDATED,
          message: 'Descripción del problema actualizada',
        });
      }
    }

    if (dto.categoryId !== undefined) {
      const nextCategoryId = dto.categoryId ?? null;
      if (nextCategoryId !== current.categoryId) {
        if (nextCategoryId) await this.assertCategoryExists(nextCategoryId);
        data.category = nextCategoryId
          ? { connect: { id: nextCategoryId } }
          : { disconnect: true };
        events.push({
          type: MaintenanceEventType.UPDATED,
          message: 'Categoría actualizada',
        });
      }
    }

    if (dto.completionNotes !== undefined) {
      data.completionNotes = dto.completionNotes.trim() || null;
    }

    if (dto.status && dto.status !== current.status) {
      Object.assign(
        data,
        this.statusTransitionData(current.status, dto.status),
      );
      events.push({
        type: statusEventType(dto.status),
        message: `Estado cambiado a ${dto.status}`,
      });
    }

    if (Object.keys(data).length === 0) return this.getJob(id);

    await this.prisma.maintenanceJob.update({
      where: { id },
      data: {
        ...data,
        events: {
          create: events.map((event) => ({
            type: event.type,
            message: event.message,
            actorUserId,
          })),
        },
      },
    });

    return this.getJob(id);
  }

  /** Technician taps "Iniciar" in the portal. */
  async start(id: string, actorUserId: string): Promise<MaintenanceJobDto> {
    const job = await this.findOwnedJob(id, actorUserId);
    if (job.status !== MaintenanceJobStatus.PENDING) {
      throw new BadRequestException('La orden ya fue iniciada');
    }

    await this.prisma.maintenanceJob.update({
      where: { id },
      data: {
        status: MaintenanceJobStatus.IN_PROGRESS,
        startedAt: new Date(),
        events: {
          create: {
            type: MaintenanceEventType.STARTED,
            message: 'Trabajo iniciado',
            actorUserId,
          },
        },
      },
    });

    return this.getJob(id);
  }

  async complete(
    id: string,
    dto: CompleteMaintenanceJobDto,
    actorUserId: string,
  ): Promise<MaintenanceJobDto> {
    const job = await this.findOwnedJob(id, actorUserId);
    if (job.status === MaintenanceJobStatus.COMPLETED) {
      throw new BadRequestException('La orden ya está finalizada');
    }
    if (job.status === MaintenanceJobStatus.CANCELLED) {
      throw new BadRequestException('La orden está cancelada');
    }

    const now = new Date();
    await this.prisma.maintenanceJob.update({
      where: { id },
      data: {
        status: MaintenanceJobStatus.COMPLETED,
        completedAt: now,
        startedAt: job.startedAt ?? now,
        completionNotes: dto.completionNotes?.trim() || null,
        events: {
          create: {
            type: MaintenanceEventType.COMPLETED,
            message: 'Trabajo finalizado',
            actorUserId,
          },
        },
      },
    });

    return this.getJob(id);
  }

  async cancel(id: string, actorUserId: string): Promise<MaintenanceJobDto> {
    const job = await this.prisma.maintenanceJob.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!job)
      throw new NotFoundException('Orden de mantenimiento no encontrada');
    if (job.status === MaintenanceJobStatus.CANCELLED) return this.getJob(id);

    await this.prisma.maintenanceJob.update({
      where: { id },
      data: {
        status: MaintenanceJobStatus.CANCELLED,
        cancelledAt: new Date(),
        events: {
          create: {
            type: MaintenanceEventType.CANCELLED,
            message: 'Orden cancelada',
            actorUserId,
          },
        },
      },
    });

    return this.getJob(id);
  }

  async reopen(id: string, actorUserId: string): Promise<MaintenanceJobDto> {
    const job = await this.prisma.maintenanceJob.findUnique({
      where: { id },
      select: { id: true, status: true, startedAt: true },
    });
    if (!job)
      throw new NotFoundException('Orden de mantenimiento no encontrada');
    if (
      job.status !== MaintenanceJobStatus.COMPLETED &&
      job.status !== MaintenanceJobStatus.CANCELLED
    ) {
      throw new BadRequestException('La orden ya está abierta');
    }

    await this.prisma.maintenanceJob.update({
      where: { id },
      data: {
        status: job.startedAt
          ? MaintenanceJobStatus.IN_PROGRESS
          : MaintenanceJobStatus.PENDING,
        completedAt: null,
        cancelledAt: null,
        events: {
          create: {
            type: MaintenanceEventType.REOPENED,
            message: 'Orden reabierta',
            actorUserId,
          },
        },
      },
    });

    return this.getJob(id);
  }

  /**
   * Proof photos live in their own table and S3 folder, so they never appear
   * in the Imágenes module.
   */
  async uploadPhoto(
    id: string,
    actorUserId: string,
    dto: UploadMaintenancePhotoDto,
  ): Promise<MaintenanceJobDto> {
    const job = await this.findOwnedJob(id, actorUserId);
    if (job.status === MaintenanceJobStatus.CANCELLED) {
      throw new BadRequestException(
        'No puedes agregar evidencia a una orden cancelada',
      );
    }

    const processed = await this.processor.toWebp(
      decodeBase64Image(dto.imageBase64),
    );
    const upload = await this.storage.uploadBuffer({
      buffer: processed.buffer,
      mimeType: processed.mimeType,
      extension: processed.extension,
      folder: PHOTO_FOLDER,
    });

    try {
      // The first photo doubles as the signal that work actually began.
      const shouldStart = job.status === MaintenanceJobStatus.PENDING;
      await this.prisma.maintenanceJob.update({
        where: { id },
        data: {
          ...(shouldStart
            ? {
                status: MaintenanceJobStatus.IN_PROGRESS,
                startedAt: new Date(),
              }
            : {}),
          photos: {
            create: {
              s3Key: upload.key,
              note: dto.note?.trim() || null,
              uploadedByUserId: actorUserId,
            },
          },
          events: {
            create: [
              ...(shouldStart
                ? [
                    {
                      type: MaintenanceEventType.STARTED,
                      message: 'Trabajo iniciado al subir evidencia',
                      actorUserId,
                    },
                  ]
                : []),
              {
                type: MaintenanceEventType.PHOTO_UPLOADED,
                message: 'Evidencia fotográfica agregada',
                actorUserId,
              },
            ],
          },
        },
      });
    } catch (error) {
      void this.storage.deleteByKey(upload.key);
      throw error;
    }

    return this.getJob(id);
  }

  /**
   * Copies a proof photo into the Imágenes module as a maintenance image. The
   * copy is owned by whoever took the photo, not by the supervisor publishing
   * it, and the link back is what keeps the dashboard from duplicating it.
   */
  async publishPhotoToImages(
    photoId: string,
    actorUserId: string,
  ): Promise<MaintenanceJobDto> {
    const photo = await this.prisma.maintenancePhoto.findUnique({
      where: { id: photoId },
      select: {
        id: true,
        jobId: true,
        s3Key: true,
        note: true,
        s3ImageId: true,
        uploadedByUserId: true,
        job: { select: { code: true, billboardCode: true } },
      },
    });
    if (!photo) throw new NotFoundException('Evidencia no encontrada');
    if (photo.s3ImageId) {
      throw new BadRequestException('Esta foto ya está en el módulo Imágenes');
    }

    const staticBillboardCodeId = await this.resolveStaticBillboardCodeId(
      photo.job.billboardCode,
    );

    const buffer = await this.storage.getObjectBuffer(photo.s3Key);
    const image = await this.s3Images.createFromBuffer(
      buffer,
      {
        type: S3ImageType.STATIC_BILLBOARD_MAINTENANCE,
        staticBillboardCodeId,
        tags: [photo.job.code],
      },
      photo.uploadedByUserId ?? actorUserId,
    );

    try {
      await this.prisma.maintenancePhoto.update({
        where: { id: photoId },
        data: { s3ImageId: image.id },
      });
    } catch (error) {
      await this.s3Images.remove(image.id).catch(() => undefined);
      throw error;
    }

    await this.prisma.maintenanceEvent.create({
      data: {
        jobId: photo.jobId,
        type: MaintenanceEventType.UPDATED,
        message: 'Evidencia agregada al módulo Imágenes',
        actorUserId,
      },
    });

    return this.getJob(photo.jobId);
  }

  async deletePhoto(
    photoId: string,
    actorUserId: string,
  ): Promise<MaintenanceJobDto> {
    const photo = await this.prisma.maintenancePhoto.findUnique({
      where: { id: photoId },
      select: { id: true, jobId: true, s3Key: true },
    });
    if (!photo) throw new NotFoundException('Evidencia no encontrada');

    await this.prisma.maintenancePhoto.delete({ where: { id: photoId } });
    await this.prisma.maintenanceEvent.create({
      data: {
        jobId: photo.jobId,
        type: MaintenanceEventType.PHOTO_DELETED,
        message: 'Evidencia fotográfica eliminada',
        actorUserId,
      },
    });

    void this.storage.deleteByKey(photo.s3Key).catch((error: unknown) => {
      this.logger.warn(
        `No se pudo borrar la evidencia ${photo.s3Key}: ${String(error)}`,
      );
    });

    return this.getJob(photo.jobId);
  }

  private buildWhere(
    query: ListMaintenanceJobsQueryDto,
  ): Prisma.MaintenanceJobWhereInput {
    const where: Prisma.MaintenanceJobWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.assignedUserId) where.assignedUserId = query.assignedUserId;

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { billboardCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.from || query.to) {
      where.scheduledAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    return where;
  }

  private statusTransitionData(
    from: MaintenanceJobStatus,
    to: MaintenanceJobStatus,
  ): Prisma.MaintenanceJobUpdateInput {
    const now = new Date();
    switch (to) {
      case MaintenanceJobStatus.IN_PROGRESS:
        return {
          status: to,
          startedAt: now,
          completedAt: null,
          cancelledAt: null,
        };
      case MaintenanceJobStatus.COMPLETED:
        return { status: to, completedAt: now, cancelledAt: null };
      case MaintenanceJobStatus.CANCELLED:
        return { status: to, cancelledAt: now };
      case MaintenanceJobStatus.PENDING:
        if (from === MaintenanceJobStatus.IN_PROGRESS) {
          throw new BadRequestException(
            'Una orden iniciada no puede volver a pendiente',
          );
        }
        return { status: to, completedAt: null, cancelledAt: null };
    }
  }

  private async findOwnedJob(id: string, userId: string) {
    const job = await this.prisma.maintenanceJob.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startedAt: true,
        assignedUserId: true,
      },
    });
    if (!job)
      throw new NotFoundException('Orden de mantenimiento no encontrada');

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    // Supervisors can act on any job; technicians only on their own.
    if (actor?.role === 'MANTENIMIENTO' && job.assignedUserId !== userId) {
      throw new ForbiddenException('Esta orden no está asignada a tu cuenta');
    }

    return job;
  }

  /** Imágenes groups by billboard code, so create it on demand. */
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

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const found = await this.prisma.maintenanceCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!found) throw new BadRequestException('La categoría no existe');
  }

  private async generateJobCode(): Promise<string> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const yearSuffix = String(now.getFullYear()).slice(-2);
    const numberPattern = `^MNT[0-9]+/${yearSuffix}$`;

    const rows = await this.prisma.$queryRaw<
      Array<{ max_sequence: number | null }>
    >`
      SELECT MAX(
        CASE
          WHEN "code" ~ ${numberPattern}
          THEN CAST(
            SUBSTRING("code" FROM 4 FOR POSITION('/' IN "code") - 4) AS INTEGER
          )
          ELSE NULL
        END
      ) AS max_sequence
      FROM "maintenance_jobs"
      WHERE "createdAt" >= ${yearStart}
        AND "createdAt" < ${yearEnd}
    `;

    const maxSequence = Number(rows[0]?.max_sequence ?? 0);
    return `MNT${String(maxSequence + 1).padStart(4, '0')}/${yearSuffix}`;
  }

  private async mapDetail(row: DetailRow): Promise<MaintenanceJobDto> {
    const location = row.billboardId
      ? await this.billboards
          .getBillboardLocation(row.billboardId)
          .catch(() => null)
      : null;

    const photos = await Promise.all(
      row.photos.map(async (photo) => ({
        id: photo.id,
        url: await this.storage.getSignedUrl(photo.s3Key),
        note: photo.note,
        uploadedBy: photo.uploadedBy ?? null,
        createdAt: photo.createdAt.toISOString(),
        publishedImageId: photo.s3ImageId,
      })),
    );

    return {
      ...mapListItem(row),
      width: location?.width ?? row.width,
      height: location?.height ?? row.height,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      reference: location?.reference ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      completionNotes: row.completionNotes,
      createdBy: row.createdBy ?? null,
      photos,
      events: row.events.map((event) => ({
        id: event.id,
        type: event.type,
        message: event.message,
        actor: event.actor ?? null,
        createdAt: event.createdAt.toISOString(),
      })),
      minutesToStart: minutesBetween(row.scheduledAt, row.startedAt),
      minutesWorked: minutesBetween(row.startedAt, row.completedAt),
    };
  }
}

function mapListItem(row: ListRow): MaintenanceJobListItemDto {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    billboardId: row.billboardId,
    billboardCode: row.billboardCode,
    address: row.address,
    cityName: row.cityName,
    departmentName: row.departmentName,
    description: row.description,
    scheduledAt: row.scheduledAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    category: row.category,
    assignedUser: row.assignedUser,
    photoCount: row._count.photos,
    createdAt: row.createdAt.toISOString(),
    isOverdue:
      row.status !== MaintenanceJobStatus.COMPLETED &&
      row.status !== MaintenanceJobStatus.CANCELLED &&
      row.scheduledAt.getTime() < Date.now(),
  };
}

function statusEventType(status: MaintenanceJobStatus): MaintenanceEventType {
  switch (status) {
    case MaintenanceJobStatus.IN_PROGRESS:
      return MaintenanceEventType.STARTED;
    case MaintenanceJobStatus.COMPLETED:
      return MaintenanceEventType.COMPLETED;
    case MaintenanceJobStatus.CANCELLED:
      return MaintenanceEventType.CANCELLED;
    case MaintenanceJobStatus.PENDING:
      return MaintenanceEventType.REOPENED;
  }
}
