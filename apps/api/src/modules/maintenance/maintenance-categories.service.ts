import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateMaintenanceCategoryDto,
  UpdateMaintenanceCategoryDto,
} from './dto/maintenance-category.dto.js';

export interface MaintenanceCategoryDto {
  id: string;
  name: string;
  color: string | null;
  archived: boolean;
  jobCount: number;
  createdAt: string;
}

@Injectable()
export class MaintenanceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(includeArchived = false): Promise<MaintenanceCategoryDto[]> {
    const rows = await this.prisma.maintenanceCategory.findMany({
      where: includeArchived ? {} : { archived: false },
      include: { _count: { select: { jobs: true } } },
      orderBy: [{ archived: 'asc' }, { name: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      archived: row.archived,
      jobCount: row._count.jobs,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async create(
    dto: CreateMaintenanceCategoryDto,
  ): Promise<MaintenanceCategoryDto> {
    const name = dto.name.trim();
    try {
      const created = await this.prisma.maintenanceCategory.create({
        data: { name, color: dto.color ?? null },
        include: { _count: { select: { jobs: true } } },
      });
      return {
        id: created.id,
        name: created.name,
        color: created.color,
        archived: created.archived,
        jobCount: created._count.jobs,
        createdAt: created.createdAt.toISOString(),
      };
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
      return {
        id: updated.id,
        name: updated.name,
        color: updated.color,
        archived: updated.archived,
        jobCount: updated._count.jobs,
        createdAt: updated.createdAt.toISOString(),
      };
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

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
