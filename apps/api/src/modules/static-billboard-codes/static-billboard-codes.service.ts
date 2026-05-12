import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStaticBillboardCodeDto } from './dto/create-static-billboard-code.dto.js';

export interface StaticBillboardCodeListItem {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListStaticBillboardCodesFilters {
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedStaticBillboardCodes {
  data: StaticBillboardCodeListItem[];
  nextCursor: string | null;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function clampLimit(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
}

@Injectable()
export class StaticBillboardCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    filters: ListStaticBillboardCodesFilters = {},
  ): Promise<PaginatedStaticBillboardCodes> {
    const limit = clampLimit(filters.limit);
    const search = filters.search?.trim();

    const where: Prisma.StaticBillboardCodesWhereInput = search
      ? { code: { contains: search, mode: 'insensitive' } }
      : {};

    const rows = await this.prisma.staticBillboardCodes.findMany({
      where,
      take: limit + 1,
      ...(filters.cursor
        ? { skip: 1, cursor: { id: filters.cursor } }
        : {}),
      orderBy: [{ code: 'asc' }, { id: 'asc' }],
    });

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1].id : null;

    return {
      data: pageRows.map((row) => ({
        id: row.id,
        code: row.code,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      nextCursor,
    };
  }

  async findOne(id: string): Promise<StaticBillboardCodeListItem> {
    const row = await this.prisma.staticBillboardCodes.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Código de valla no encontrado');
    return {
      id: row.id,
      code: row.code,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(
    dto: CreateStaticBillboardCodeDto,
  ): Promise<StaticBillboardCodeListItem> {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.staticBillboardCodes.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`El código "${code}" ya existe.`);
    }

    try {
      const row = await this.prisma.staticBillboardCodes.create({
        data: { code },
      });
      return {
        id: row.id,
        code: row.code,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(`El código "${code}" ya existe.`);
      }
      throw e;
    }
  }
}
