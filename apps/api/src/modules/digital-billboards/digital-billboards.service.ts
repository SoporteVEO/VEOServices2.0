import {
  Injectable,
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

export interface DigitalBillboardInput {
  code: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  maxSpots?: number;
  turnOnAt?: string;
  turnOffAt?: string;
  position?: number;
  aliases?: string[];
  imageBase64?: string | null;
}

@Injectable()
export class DigitalBillboardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imgbb: ImgbbService,
  ) {}

  async list(): Promise<DigitalBillboardListItem[]> {
    const rows = await this.prisma.digitalBillboard.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
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

  async findOne(id: string) {
    const board = await this.prisma.digitalBillboard.findUnique({
      where: { id },
      include: { image: true },
    });
    if (!board) throw new NotFoundException('Pantalla no encontrada');
    return board;
  }

  async create(input: DigitalBillboardInput) {
    const imageId = await this.uploadImage(input.imageBase64);
    try {
      return await this.prisma.digitalBillboard.create({
        data: {
          code: input.code.trim().toUpperCase(),
          name: input.name.trim(),
          address: input.address?.trim() ?? '',
          latitude: input.latitude ?? 0,
          longitude: input.longitude ?? 0,
          price: input.price ?? 0,
          ...(input.maxSpots != null ? { maxSpots: input.maxSpots } : {}),
          ...(input.turnOnAt ? { turnOnAt: input.turnOnAt } : {}),
          ...(input.turnOffAt ? { turnOffAt: input.turnOffAt } : {}),
          ...(input.position != null ? { position: input.position } : {}),
          aliases: normalizeAliases(input.aliases ?? [input.name]),
          ...(imageId ? { imageId } : {}),
        },
      });
    } catch (e) {
      await this.discardImage(imageId);
      throw mapUniqueError(e);
    }
  }

  async update(id: string, input: Partial<DigitalBillboardInput>) {
    await this.findOne(id);
    const imageId = await this.uploadImage(input.imageBase64);
    try {
      return await this.prisma.digitalBillboard.update({
        where: { id },
        data: {
          ...(input.code !== undefined
            ? { code: input.code.trim().toUpperCase() }
            : {}),
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.address !== undefined
            ? { address: input.address.trim() }
            : {}),
          ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
          ...(input.longitude !== undefined
            ? { longitude: input.longitude }
            : {}),
          ...(input.price !== undefined ? { price: input.price } : {}),
          ...(input.maxSpots !== undefined ? { maxSpots: input.maxSpots } : {}),
          ...(input.turnOnAt !== undefined ? { turnOnAt: input.turnOnAt } : {}),
          ...(input.turnOffAt !== undefined
            ? { turnOffAt: input.turnOffAt }
            : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
          ...(input.aliases !== undefined
            ? { aliases: normalizeAliases(input.aliases) }
            : {}),
          ...(imageId ? { imageId } : {}),
        },
      });
    } catch (e) {
      await this.discardImage(imageId);
      throw mapUniqueError(e);
    }
  }

  private async uploadImage(imageBase64?: string | null) {
    const normalized =
      imageBase64 && imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;
    if (!normalized) return null;

    const urls = await this.imgbb.upload(normalized);
    const image = await this.prisma.image.create({
      data: {
        completeUrl: urls.completeUrl,
        thumbnailUrl: urls.thumbnailUrl,
        mediumUrl: urls.mediumUrl,
        deleteUrl: urls.deleteUrl,
      },
    });
    return image.id;
  }

  private async discardImage(imageId: string | null) {
    if (!imageId) return;
    await this.prisma.image
      .delete({ where: { id: imageId } })
      .catch(() => undefined);
  }
}

export function normalizeAlias(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAliases(values: string[]) {
  return [...new Set(values.map(normalizeAlias).filter(Boolean))];
}

function mapUniqueError(e: unknown) {
  if ((e as { code?: string })?.code === 'P2002') {
    return new ConflictException('Ya existe una pantalla con ese código');
  }
  return e;
}
