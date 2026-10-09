import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FleetServiceType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ImageProcessorService } from '../s3-images/image-processor.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import type {
  CreateFleetVehicleDto,
  ListFleetVehiclesQueryDto,
  UpdateFleetVehicleDto,
} from './dto/fleet-vehicle.dto.js';

const PHOTO_FOLDER = 'fleet/vehicles';

export interface FleetPersonDto {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export interface FleetMaintenanceDto {
  id: string;
  vehicleId: string;
  type: FleetServiceType;
  performedAt: string;
  mileageKm: number;
  cost: number;
  description: string;
  workshop: string | null;
  invoiceNumber: string | null;
  nextServiceKm: number | null;
  nextServiceAt: string | null;
  createdBy: FleetPersonDto | null;
  createdAt: string;
}

export interface FleetVehicleDto {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  notes: string | null;
  photoUrl: string | null;
  archived: boolean;
  initialMileageKm: number | null;
  /** Odometer at the latest logged service, or the initial reading if none. */
  lastMaintenanceKm: number | null;
  lastMaintenanceAt: string | null;
  nextServiceKm: number | null;
  nextServiceAt: string | null;
  serviceCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface FleetVehicleDetailDto extends FleetVehicleDto {
  createdBy: FleetPersonDto | null;
  services: FleetMaintenanceDto[];
}

export const FLEET_PERSON_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export const FLEET_SERVICE_INCLUDE = {
  createdBy: { select: FLEET_PERSON_SELECT },
} satisfies Prisma.FleetMaintenanceInclude;

const SERVICE_ORDER: Prisma.FleetMaintenanceOrderByWithRelationInput[] = [
  { performedAt: 'desc' },
  { createdAt: 'desc' },
];

const LIST_INCLUDE = {
  services: { orderBy: SERVICE_ORDER, take: 1 },
  _count: { select: { services: true } },
} satisfies Prisma.FleetVehicleInclude;

const DETAIL_INCLUDE = {
  createdBy: { select: FLEET_PERSON_SELECT },
  services: { orderBy: SERVICE_ORDER, include: FLEET_SERVICE_INCLUDE },
  _count: { select: { services: true } },
} satisfies Prisma.FleetVehicleInclude;

type ListRow = Prisma.FleetVehicleGetPayload<{ include: typeof LIST_INCLUDE }>;
type ServiceRow = Prisma.FleetMaintenanceGetPayload<{
  include: typeof FLEET_SERVICE_INCLUDE;
}>;

function decodeBase64Image(base64: string): Buffer {
  const normalized = base64.includes(',') ? base64.split(',')[1] : base64;
  if (!normalized) {
    throw new BadRequestException('La imagen está vacía o es inválida');
  }
  return Buffer.from(normalized, 'base64');
}

function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, ' ');
}

function optionalText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

export function mapFleetService(row: ServiceRow): FleetMaintenanceDto {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    type: row.type,
    performedAt: row.performedAt.toISOString(),
    mileageKm: row.mileageKm,
    cost: row.cost,
    description: row.description,
    workshop: row.workshop,
    invoiceNumber: row.invoiceNumber,
    nextServiceKm: row.nextServiceKm,
    nextServiceAt: row.nextServiceAt?.toISOString() ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Company car inventory. The odometer and spend figures shown per vehicle are
 * derived from its service log rather than stored, so editing or deleting a
 * service can never leave them out of sync.
 */
@Injectable()
export class FleetVehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly processor: ImageProcessorService,
  ) {}

  async list(query: ListFleetVehiclesQueryDto): Promise<FleetVehicleDto[]> {
    const search = query.search?.trim();
    const where: Prisma.FleetVehicleWhereInput = {
      ...(query.includeArchived === 'true' ? {} : { archived: false }),
      ...(search
        ? {
            OR: [
              { plate: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
              { model: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.fleetVehicle.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: [{ archived: 'asc' }, { plate: 'asc' }],
    });

    const spent = await this.prisma.fleetMaintenance.groupBy({
      by: ['vehicleId'],
      where: { vehicleId: { in: rows.map((row) => row.id) } },
      _sum: { cost: true },
    });
    const spentByVehicle = new Map(
      spent.map((entry) => [entry.vehicleId, entry._sum.cost ?? 0]),
    );

    return Promise.all(
      rows.map((row) => this.mapVehicle(row, spentByVehicle.get(row.id) ?? 0)),
    );
  }

  async getDetail(id: string): Promise<FleetVehicleDetailDto> {
    const row = await this.prisma.fleetVehicle.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!row) throw new NotFoundException('Vehículo no encontrado');

    const totalSpent = row.services.reduce((sum, s) => sum + s.cost, 0);
    const base = await this.mapVehicle(row, totalSpent);

    return {
      ...base,
      createdBy: row.createdBy,
      services: row.services.map(mapFleetService),
    };
  }

  async create(
    dto: CreateFleetVehicleDto,
    actorUserId: string,
  ): Promise<FleetVehicleDetailDto> {
    const photoS3Key = dto.photoBase64
      ? await this.uploadPhoto(dto.photoBase64)
      : null;

    try {
      const created = await this.prisma.fleetVehicle.create({
        data: {
          plate: normalizePlate(dto.plate),
          brand: dto.brand.trim(),
          model: dto.model.trim(),
          year: dto.year ?? null,
          color: optionalText(dto.color),
          notes: optionalText(dto.notes),
          initialMileageKm: dto.initialMileageKm ?? null,
          photoS3Key,
          createdByUserId: actorUserId,
        },
        select: { id: true },
      });
      return this.getDetail(created.id);
    } catch (error) {
      if (photoS3Key) void this.storage.deleteByKey(photoS3Key);
      throw this.translateError(error);
    }
  }

  async update(
    id: string,
    dto: UpdateFleetVehicleDto,
  ): Promise<FleetVehicleDetailDto> {
    const existing = await this.findOrThrow(id);

    const data: Prisma.FleetVehicleUpdateInput = {};
    if (dto.plate !== undefined) data.plate = normalizePlate(dto.plate);
    if (dto.brand !== undefined) data.brand = dto.brand.trim();
    if (dto.model !== undefined) data.model = dto.model.trim();
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.color !== undefined) data.color = optionalText(dto.color);
    if (dto.notes !== undefined) data.notes = optionalText(dto.notes);
    if (dto.initialMileageKm !== undefined) {
      data.initialMileageKm = dto.initialMileageKm;
    }
    if (dto.archived !== undefined) data.archived = dto.archived;

    let uploadedKey: string | null = null;
    if (dto.photoBase64) {
      uploadedKey = await this.uploadPhoto(dto.photoBase64);
      data.photoS3Key = uploadedKey;
    } else if (dto.removePhoto) {
      data.photoS3Key = null;
    }

    try {
      await this.prisma.fleetVehicle.update({ where: { id }, data });
    } catch (error) {
      if (uploadedKey) void this.storage.deleteByKey(uploadedKey);
      throw this.translateError(error);
    }

    const photoReplaced = uploadedKey !== null || dto.removePhoto;
    if (photoReplaced && existing.photoS3Key) {
      void this.storage.deleteByKey(existing.photoS3Key);
    }

    return this.getDetail(id);
  }

  /**
   * A car with logged services is archived instead of deleted so its history
   * and spend stay on record.
   */
  async remove(id: string): Promise<{ deleted: boolean }> {
    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id },
      select: {
        id: true,
        photoS3Key: true,
        _count: { select: { services: true } },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    if (vehicle._count.services > 0) {
      await this.prisma.fleetVehicle.update({
        where: { id },
        data: { archived: true },
      });
      return { deleted: false };
    }

    await this.prisma.fleetVehicle.delete({ where: { id } });
    if (vehicle.photoS3Key) void this.storage.deleteByKey(vehicle.photoS3Key);
    return { deleted: true };
  }

  async findOrThrow(id: string) {
    const found = await this.prisma.fleetVehicle.findUnique({
      where: { id },
      select: { id: true, photoS3Key: true },
    });
    if (!found) throw new NotFoundException('Vehículo no encontrado');
    return found;
  }

  private async uploadPhoto(base64: string): Promise<string> {
    const processed = await this.processor.toWebp(decodeBase64Image(base64));
    const upload = await this.storage.uploadBuffer({
      buffer: processed.buffer,
      mimeType: processed.mimeType,
      extension: processed.extension,
      folder: PHOTO_FOLDER,
    });
    return upload.key;
  }

  private translateError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        'Ya existe un vehículo registrado con esa placa',
      );
    }
    return error;
  }

  private async mapVehicle(
    row: Pick<
      ListRow,
      | 'id'
      | 'plate'
      | 'brand'
      | 'model'
      | 'year'
      | 'color'
      | 'notes'
      | 'photoS3Key'
      | 'archived'
      | 'initialMileageKm'
      | 'createdAt'
      | '_count'
    > & {
      services: Pick<
        ListRow['services'][number],
        'mileageKm' | 'performedAt' | 'nextServiceKm' | 'nextServiceAt'
      >[];
    },
    totalSpent: number,
  ): Promise<FleetVehicleDto> {
    const latest = row.services[0] ?? null;
    return {
      id: row.id,
      plate: row.plate,
      brand: row.brand,
      model: row.model,
      year: row.year,
      color: row.color,
      notes: row.notes,
      photoUrl: row.photoS3Key
        ? await this.storage.getSignedUrl(row.photoS3Key)
        : null,
      archived: row.archived,
      initialMileageKm: row.initialMileageKm,
      lastMaintenanceKm: latest?.mileageKm ?? row.initialMileageKm,
      lastMaintenanceAt: latest?.performedAt.toISOString() ?? null,
      nextServiceKm: latest?.nextServiceKm ?? null,
      nextServiceAt: latest?.nextServiceAt?.toISOString() ?? null,
      serviceCount: row._count.services,
      totalSpent: Math.round(totalSpent * 100) / 100,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
