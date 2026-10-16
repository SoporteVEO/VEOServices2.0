import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MaintenanceJobKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateMaintenanceCategoryDto,
  UpdateMaintenanceCategoryDto,
} from './dto/maintenance-category.dto.js';

export interface MaintenanceCategoryDto {
  id: string;
  kind: MaintenanceJobKind;
  name: string;
  color: string | null;
  archived: boolean;
  jobCount: number;
  createdAt: string;
}

@Injectable()
export class MaintenanceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    kind: MaintenanceJobKind,
    includeArchived = false,
  ): Promise<MaintenanceCategoryDto[]> {
    const rows = await this.prisma.maintenanceCategory.findMany({
      where: includeArchived ? { kind } : { kind, archived: false },
      include: { _count: { select: { jobs: true } } },
      orderBy: [{ archived: 'asc' }, { name: 'asc' }],
    });

    return rows.map(mapCategory);
  }

  async create(
    dto: CreateMaintenanceCategoryDto,
  ): Promise<MaintenanceCategoryDto> {
    const name = dto.name.trim();
    try {
      const created = await this.prisma.maintenanceCategory.create({
        data: {
          kind: dto.kind ?? MaintenanceJobKind.STATIC,
          name,
          color: dto.color ?? null,
        },
        include: { _count: { select: { jobs: true } } },
      });
      return mapCategory(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`La categoría "${name}" ya existe`);
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateMaintenanceCategoryDto,
  ): Promise<MaintenanceCategoryDto> {
    await this.findOrThrow(id);

    const data: Prisma.MaintenanceCategoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.archived !== undefined) data.archived = dto.archived;

    try {
      const updated = await this.prisma.maintenanceCategory.update({
        where: { id },
        data,
        include: { _count: { select: { jobs: true } } },
      });
      return mapCategory(updated);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  /**
   * Categories already used by a job are archived instead of deleted so the
   * Historial of past work keeps its label.
   */
  async remove(id: string): Promise<{ deleted: boolean }> {
    const category = await this.prisma.maintenanceCategory.findUnique({
      where: { id },
      select: { id: true, _count: { select: { jobs: true } } },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    if (category._count.jobs > 0) {
      await this.prisma.maintenanceCategory.update({
        where: { id },
        data: { archived: true },
      });
      return { deleted: false };
    }

    await this.prisma.maintenanceCategory.delete({ where: { id } });
    return { deleted: true };
  }

  private async findOrThrow(id: string) {
    const found = await this.prisma.maintenanceCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Categoría no encontrada');
    return found;
  }
}

function mapCategory(
  row: Prisma.MaintenanceCategoryGetPayload<{
    include: { _count: { select: { jobs: true } } };
  }>,
): MaintenanceCategoryDto {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    color: row.color,
    archived: row.archived,
    jobCount: row._count.jobs,
    createdAt: row.createdAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
