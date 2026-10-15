import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CrmStageKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEFAULT_PIPELINE_NAME, DEFAULT_STAGES } from './crm.constants.js';
import type {
  CreatePipelineDto,
  StageInputDto,
  UpdatePipelineDto,
} from './dto/crm-pipeline.dto.js';

export interface CrmStageItem {
  id: string;
  name: string;
  color: string | null;
  position: number;
  probability: number;
  kind: CrmStageKind;
  rottingDays: number | null;
  openDeals: number;
  openValue: number;
}

export interface CrmPipelineItem {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  archived: boolean;
  position: number;
  stages: CrmStageItem[];
  createdAt: string;
}

const PIPELINE_INCLUDE = {
  stages: { orderBy: { position: 'asc' } },
} as const satisfies Prisma.CrmPipelineInclude;

type PipelineRow = Prisma.CrmPipelineGetPayload<{
  include: typeof PIPELINE_INCLUDE;
}>;

function assertStageKinds(stages: StageInputDto[]) {
  const count = (kind: CrmStageKind) =>
    stages.filter((s) => s.kind === kind).length;
  if (count('OPEN') < 1) {
    throw new BadRequestException(
      'El pipeline necesita al menos una etapa abierta',
    );
  }
  if (count('WON') !== 1 || count('LOST') !== 1) {
    throw new BadRequestException(
      'El pipeline debe tener exactamente una etapa "Ganado" y una "Perdido"',
    );
  }
}

/** Closed stages always sit at the end so the board reads left to right. */
function orderStages(stages: StageInputDto[]): StageInputDto[] {
  const rank: Record<CrmStageKind, number> = { OPEN: 0, WON: 1, LOST: 2 };
  return stages
    .map((stage, index) => ({ stage, index }))
    .sort(
      (a, b) => rank[a.stage.kind] - rank[b.stage.kind] || a.index - b.index,
    )
    .map(({ stage }) => stage);
}

@Injectable()
export class CrmPipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(includeArchived = false): Promise<CrmPipelineItem[]> {
    await this.ensureDefaultPipeline();
    const rows = await this.prisma.crmPipeline.findMany({
      where: includeArchived ? {} : { archived: false },
      include: PIPELINE_INCLUDE,
      orderBy: [
        { isDefault: 'desc' },
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    return this.serializeMany(rows);
  }

  async get(id: string): Promise<CrmPipelineItem> {
    const row = await this.prisma.crmPipeline.findUnique({
      where: { id },
      include: PIPELINE_INCLUDE,
    });
    if (!row) throw new NotFoundException('Pipeline no encontrado');
    const [item] = await this.serializeMany([row]);
    return item;
  }

  /** The pipeline used when a request does not name one. */
  async resolvePipelineId(pipelineId?: string): Promise<string> {
    if (pipelineId) return pipelineId;
    await this.ensureDefaultPipeline();
    const row = await this.prisma.crmPipeline.findFirst({
      where: { archived: false },
      orderBy: [
        { isDefault: 'desc' },
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
      select: { id: true },
    });
    if (!row) throw new NotFoundException('No hay pipelines disponibles');
    return row.id;
  }

  async create(dto: CreatePipelineDto): Promise<CrmPipelineItem> {
    assertStageKinds(dto.stages);
    const position = await this.prisma.crmPipeline.count();
    const created = await this.prisma.crmPipeline.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        position,
        stages: {
          create: orderStages(dto.stages).map((stage, index) => ({
            name: stage.name.trim(),
            color: stage.color ?? null,
            probability: stage.probability,
            kind: stage.kind,
            rottingDays: stage.rottingDays ?? null,
            position: index,
          })),
        },
      },
      select: { id: true },
    });
    return this.get(created.id);
  }

  async update(id: string, dto: UpdatePipelineDto): Promise<CrmPipelineItem> {
    const existing = await this.prisma.crmPipeline.findUnique({
      where: { id },
      include: { stages: { include: { _count: { select: { deals: true } } } } },
    });
    if (!existing) throw new NotFoundException('Pipeline no encontrado');
    if (dto.archived && existing.isDefault) {
      throw new BadRequestException(
        'No puedes archivar el pipeline predeterminado',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.crmPipeline.updateMany({
          where: { id: { not: id } },
          data: { isDefault: false },
        });
      }

      await tx.crmPipeline.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
          ...(dto.archived !== undefined ? { archived: dto.archived } : {}),
        },
      });

      if (!dto.stages) return;
      assertStageKinds(dto.stages);

      const incomingIds = new Set(
        dto.stages.flatMap((s) => (s.id ? [s.id] : [])),
      );
      const removed = existing.stages.filter((s) => !incomingIds.has(s.id));
      const blocked = removed.find((s) => s._count.deals > 0);
      if (blocked) {
        throw new ConflictException(
          `La etapa "${blocked.name}" tiene negocios. Muévelos antes de eliminarla.`,
        );
      }
      const changedKind = dto.stages.find((s) => {
        const current = existing.stages.find((e) => e.id === s.id);
        return current && current.kind !== s.kind && current._count.deals > 0;
      });
      if (changedKind) {
        throw new ConflictException(
          `No puedes cambiar el tipo de la etapa "${changedKind.name}" porque tiene negocios`,
        );
      }

      if (removed.length > 0) {
        await tx.crmStage.deleteMany({
          where: { id: { in: removed.map((s) => s.id) } },
        });
      }

      const ordered = orderStages(dto.stages);
      for (const [index, stage] of ordered.entries()) {
        const data = {
          name: stage.name.trim(),
          color: stage.color ?? null,
          probability: stage.probability,
          kind: stage.kind,
          rottingDays: stage.rottingDays ?? null,
          position: index,
        };
        const belongsHere =
          stage.id && existing.stages.some((s) => s.id === stage.id);
        if (belongsHere) {
          await tx.crmStage.update({ where: { id: stage.id }, data });
        } else {
          await tx.crmStage.create({ data: { ...data, pipelineId: id } });
        }
      }
    });

    return this.get(id);
  }

  /** Pipelines that already hold deals are archived so history survives. */
  async remove(id: string): Promise<{ deleted: boolean }> {
    const pipeline = await this.prisma.crmPipeline.findUnique({
      where: { id },
      select: { isDefault: true, _count: { select: { deals: true } } },
    });
    if (!pipeline) throw new NotFoundException('Pipeline no encontrado');
    if (pipeline.isDefault) {
      throw new BadRequestException(
        'Marca otro pipeline como predeterminado antes de eliminar este',
      );
    }
    if (pipeline._count.deals > 0) {
      await this.prisma.crmPipeline.update({
        where: { id },
        data: { archived: true },
      });
      return { deleted: false };
    }
    await this.prisma.crmPipeline.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureDefaultPipeline(): Promise<void> {
    const count = await this.prisma.crmPipeline.count();
    if (count > 0) return;
    await this.prisma.crmPipeline.create({
      data: {
        name: DEFAULT_PIPELINE_NAME,
        description: 'Pipeline comercial de vallas y pantallas',
        isDefault: true,
        stages: {
          create: DEFAULT_STAGES.map((stage, index) => ({
            ...stage,
            position: index,
          })),
        },
      },
    });
  }

  private async serializeMany(rows: PipelineRow[]): Promise<CrmPipelineItem[]> {
    const stageIds = rows.flatMap((row) => row.stages.map((s) => s.id));
    const totals = stageIds.length
      ? await this.prisma.crmDeal.groupBy({
          by: ['stageId'],
          where: { stageId: { in: stageIds }, status: 'OPEN' },
          _count: { _all: true },
          _sum: { value: true },
        })
      : [];
    const byStage = new Map(totals.map((t) => [t.stageId, t]));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isDefault: row.isDefault,
      archived: row.archived,
      position: row.position,
      createdAt: row.createdAt.toISOString(),
      stages: row.stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        color: stage.color,
        position: stage.position,
        probability: stage.probability,
        kind: stage.kind,
        rottingDays: stage.rottingDays,
        openDeals: byStage.get(stage.id)?._count._all ?? 0,
        openValue: byStage.get(stage.id)?._sum.value ?? 0,
      })),
    }));
  }
}
