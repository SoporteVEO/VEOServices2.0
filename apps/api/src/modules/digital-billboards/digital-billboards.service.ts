import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ImgbbService } from './imgbb.service.js';

export interface DigitalBillboardListItem {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  imageThumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  maxSpots: number;
}

export interface CreateDigitalBillboardInput {
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  maxSpots?: number;
  imageBase64?: string | null;
}

export interface CreateUsageInput {
  digitalBillboardId: string;
  timestamp: Date;
  duration: number;
  campaignName?: string | null;
  campaignDescription?: string | null;
}

@Injectable()
export class DigitalBillboardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imgbb: ImgbbService,
  ) {}

  async list(): Promise<DigitalBillboardListItem[]> {
    const rows = await this.prisma.digitalBillboard.findMany({
      orderBy: { createdAt: 'desc' },
      include: { image: true },
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      price: row.price,
      imageThumbnailUrl:
        row.image?.thumbnailUrl ?? row.image?.completeUrl ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      maxSpots: row.maxSpots,
    }));
  }

  async create(
    input: CreateDigitalBillboardInput,
  ): Promise<DigitalBillboardListItem> {
    const {
      code,
      name,
      address,
      latitude,
      longitude,
      price,
      maxSpots,
      imageBase64,
    } = input;

    if (!code || !name || !address) {
      throw new BadRequestException('code, name y address son obligatorios');
    }

    if (
      maxSpots != null &&
      (!Number.isInteger(maxSpots) || !Number.isFinite(maxSpots) || maxSpots <= 0)
    ) {
      throw new BadRequestException('maxSpots debe ser un entero positivo');
    }

    let imageId: string | undefined;

    const normalizedImageBase64 =
      imageBase64 && imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;

    if (normalizedImageBase64 && normalizedImageBase64.length > 0) {
      const urls = await this.imgbb.upload(normalizedImageBase64);
      const image = await this.prisma.image.create({
        data: {
          completeUrl: urls.completeUrl,
          thumbnailUrl: urls.thumbnailUrl,
          mediumUrl: urls.mediumUrl,
          deleteUrl: urls.deleteUrl,
        },
      });
      imageId = image.id;
    }

    try {
      const row = await this.prisma.digitalBillboard.create({
        data: {
          code,
          name,
          address,
          latitude,
          longitude,
          price,
          ...(maxSpots != null ? { maxSpots } : {}),
          ...(imageId ? { imageId } : {}),
        },
        include: { image: true },
      });

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        price: row.price,
        imageThumbnailUrl:
          row.image?.thumbnailUrl ?? row.image?.completeUrl ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        maxSpots: row.maxSpots,
      };
    } catch (e: any) {
      if (imageId) {
        await this.prisma.image
          .delete({ where: { id: imageId } })
          .catch(() => undefined);
      }
      if (e?.code === 'P2002') {
        throw new ConflictException('Ya existe una valla con ese código');
      }
      throw e;
    }
  }

  async findOne(id: string) {
    const board = await this.prisma.digitalBillboard.findUnique({
      where: { id },
      include: { image: true },
    });
    if (!board) throw new NotFoundException('Valla no encontrada');
    return board;
  }

  async listUsagesInRange(
    digitalBillboardId: string,
    from: Date,
    to: Date,
  ) {
    const usages = await this.prisma.digitalBillboardUsage.findMany({
      where: {
        digitalBillboardId,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        timestamp: true,
        duration: true,
        campaignName: true,
        campaignDescription: true,
      },
    });

    return usages.map((u) => ({
      id: u.id,
      timestamp: u.timestamp.toISOString(),
      duration: u.duration,
      campaignName: u.campaignName,
      campaignDescription: u.campaignDescription,
    }));
  }

  async createUsage(input: CreateUsageInput) {
    const { digitalBillboardId, timestamp, duration, campaignName, campaignDescription } = input;

    const d = Math.floor(duration);
    if (!Number.isFinite(duration) || d <= 0) {
      throw new BadRequestException('duration debe ser un entero positivo');
    }

    const board = await this.prisma.digitalBillboard.findUnique({
      where: { id: digitalBillboardId },
      select: { maxSpots: true },
    });
    if (!board) throw new NotFoundException('Valla no encontrada');
    if (d > board.maxSpots) {
      throw new BadRequestException(
        `duration no puede superar maxSpots (${board.maxSpots})`,
      );
    }

    const created = await this.prisma.digitalBillboardUsage.create({
      data: {
        digitalBillboardId,
        timestamp,
        duration: d,
        campaignName: campaignName ?? undefined,
        campaignDescription: campaignDescription ?? undefined,
      },
    });

    return {
      id: created.id,
      timestamp: created.timestamp.toISOString(),
      duration: created.duration,
      campaignName: created.campaignName,
      campaignDescription: created.campaignDescription,
    };
  }
}
