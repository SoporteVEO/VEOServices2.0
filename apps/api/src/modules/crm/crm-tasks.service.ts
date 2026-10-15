import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CrmPriority, CrmTaskType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrmActivitiesService } from './crm-activities.service.js';
import { endOfTodaySv } from './crm-time.js';
import {
  CRM_SUB_ROLE,
  USER_SUMMARY_SELECT,
  type CrmAuthUser,
  type CrmUserSummary,
} from './crm.constants.js';
import type {
  CreateTaskDto,
  ListTasksQueryDto,
  UpdateTaskDto,
} from './dto/crm-task.dto.js';

export interface CrmTaskItem {
  id: string;
  title: string;
  description: string | null;
  type: CrmTaskType;
  priority: CrmPriority;
  dueAt: string;
  completedAt: string | null;
  isOverdue: boolean;
  assignee: CrmUserSummary;
  deal: { id: string; title: string } | null;
  client: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string | null } | null;
  createdAt: string;
}

export interface CrmTaskCounts {
  overdue: number;
  today: number;
  upcoming: number;
}

const TASK_INCLUDE = {
  assignee: { select: USER_SUMMARY_SELECT },
  deal: { select: { id: true, title: true } },
  client: { select: { id: true, name: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
} as const satisfies Prisma.CrmTaskInclude;

type TaskRow = Prisma.CrmTaskGetPayload<{ include: typeof TASK_INCLUDE }>;

@Injectable()
export class CrmTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: CrmActivitiesService,
  ) {}

  async list(
    query: ListTasksQueryDto,
    user: CrmAuthUser,
  ): Promise<CrmTaskItem[]> {
    const where: Prisma.CrmTaskWhereInput = {};
    const assignee =
      query.assigneeId ??
      (query.dealId || query.clientId || query.contactId ? 'all' : 'me');
    if (assignee !== 'all')
      where.assigneeId = assignee === 'me' ? user.id : assignee;
    if (query.dealId) where.dealId = query.dealId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.contactId) where.contactId = query.contactId;

    const now = new Date();
    switch (query.bucket) {
      case 'overdue':
        Object.assign(where, { completedAt: null, dueAt: { lt: now } });
        break;
      case 'today':
        Object.assign(where, {
          completedAt: null,
          dueAt: { gte: now, lt: endOfTodaySv(now) },
        });
        break;
      case 'upcoming':
        Object.assign(where, {
          completedAt: null,
          dueAt: { gte: endOfTodaySv(now) },
        });
        break;
      case 'completed':
        where.completedAt = { not: null };
        break;
      case 'open':
        where.completedAt = null;
        break;
    }

    const rows = await this.prisma.crmTask.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy:
        query.bucket === 'completed'
          ? [{ completedAt: 'desc' }]
          : [
              { completedAt: { sort: 'desc', nulls: 'first' } },
              { dueAt: 'asc' },
            ],
      take: 300,
    });
    return rows.map((row) => this.serialize(row));
  }

  async counts(userId: string): Promise<CrmTaskCounts> {
    const now = new Date();
    const endOfDay = endOfTodaySv(now);
    const base = { assigneeId: userId, completedAt: null };
    const [overdue, today, upcoming] = await Promise.all([
      this.prisma.crmTask.count({ where: { ...base, dueAt: { lt: now } } }),
      this.prisma.crmTask.count({
        where: { ...base, dueAt: { gte: now, lt: endOfDay } },
      }),
      this.prisma.crmTask.count({
        where: { ...base, dueAt: { gte: endOfDay } },
      }),
    ]);
    return { overdue, today, upcoming };
  }

  async create(dto: CreateTaskDto, user: CrmAuthUser): Promise<CrmTaskItem> {
    const assigneeId = await this.resolveAssignee(dto.assigneeId, user.id);
    let clientId = dto.clientId ?? null;
    let contactId = dto.contactId ?? null;
    if (dto.dealId) {
      const deal = await this.prisma.crmDeal.findUnique({
        where: { id: dto.dealId },
        select: { clientId: true, contactId: true },
      });
      if (!deal) throw new BadRequestException('Negocio no encontrado');
      clientId ??= deal.clientId;
      contactId ??= deal.contactId;
    }

    const created = await this.prisma.crmTask.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        type: dto.type ?? 'FOLLOW_UP',
        priority: dto.priority ?? 'MEDIUM',
        dueAt: new Date(dto.dueAt),
        assigneeId,
        createdById: user.id,
        dealId: dto.dealId ?? null,
        clientId,
        contactId,
      },
      include: TASK_INCLUDE,
    });
    return this.serialize(created);
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    user: CrmAuthUser,
  ): Promise<CrmTaskItem> {
    const existing = await this.prisma.crmTask.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tarea no encontrada');

    const data: Prisma.CrmTaskUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueAt !== undefined) data.dueAt = new Date(dto.dueAt);
    if (dto.assigneeId !== undefined) {
      data.assigneeId = await this.resolveAssignee(dto.assigneeId, user.id);
    }

    const completing = dto.completed === true && !existing.completedAt;
    if (dto.completed !== undefined)
      data.completedAt = dto.completed ? new Date() : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.crmTask.update({
        where: { id },
        data,
        include: TASK_INCLUDE,
      });
      if (completing && (row.dealId || row.clientId || row.contactId)) {
        await this.activities.log(
          {
            type: 'TASK_COMPLETED',
            subject: row.title,
            dealId: row.dealId,
            clientId: row.clientId,
            contactId: row.contactId,
            actorId: user.id,
            metadata: { taskId: row.id, taskType: row.type },
          },
          tx,
        );
      }
      return row;
    });
    return this.serialize(updated);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const found = await this.prisma.crmTask.count({ where: { id } });
    if (!found) throw new NotFoundException('Tarea no encontrada');
    await this.prisma.crmTask.delete({ where: { id } });
    return { deleted: true };
  }

  private async resolveAssignee(
    assigneeId: string | undefined,
    fallback: string,
  ) {
    if (!assigneeId || assigneeId === 'me' || assigneeId === fallback)
      return fallback;
    const user = await this.prisma.user.findFirst({
      where: {
        id: assigneeId,
        disabled: false,
        subRoles: { has: CRM_SUB_ROLE },
      },
      select: { id: true },
    });
    if (!user)
      throw new BadRequestException(
        'Asigna la tarea a un usuario activo de Ventas',
      );
    return user.id;
  }

  private serialize(row: TaskRow): CrmTaskItem {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      priority: row.priority,
      dueAt: row.dueAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      isOverdue: !row.completedAt && row.dueAt.getTime() < Date.now(),
      assignee: row.assignee,
      deal: row.deal,
      client: row.client,
      contact: row.contact,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
