import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CrmActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { USER_SUMMARY_SELECT, type CrmUserSummary } from './crm.constants.js';
import type {
  CreateActivityDto,
  ListActivitiesQueryDto,
} from './dto/crm-activity.dto.js';

export interface CrmActivityItem {
  id: string;
  type: CrmActivityType;
  subject: string | null;
  body: string | null;
  occurredAt: string;
  durationMinutes: number | null;
  deal: { id: string; title: string } | null;
  clientId: string | null;
  contact: { id: string; firstName: string; lastName: string | null } | null;
  actor: CrmUserSummary | null;
  metadata: Prisma.JsonValue | null;
  createdAt: string;
}

export interface LogActivityInput {
  type: CrmActivityType;
  subject?: string | null;
  body?: string | null;
  occurredAt?: Date;
  durationMinutes?: number | null;
  dealId?: string | null;
  clientId?: string | null;
  contactId?: string | null;
  actorId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

type Db = PrismaService | Prisma.TransactionClient;

const ACTIVITY_INCLUDE = {
  deal: { select: { id: true, title: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  actor: { select: USER_SUMMARY_SELECT },
} as const;

type ActivityRow = Prisma.CrmActivityGetPayload<{
  include: typeof ACTIVITY_INCLUDE;
}>;

const MANUAL_TYPES: CrmActivityType[] = ['NOTE', 'CALL', 'MEETING'];

@Injectable()
export class CrmActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Records an event and refreshes the deal's "last activity" clock. */
  async log(input: LogActivityInput, db: Db = this.prisma): Promise<void> {
    const occurredAt = input.occurredAt ?? new Date();
    await db.crmActivity.create({
      data: {
        type: input.type,
        subject: input.subject ?? null,
        body: input.body ?? null,
        occurredAt,
        durationMinutes: input.durationMinutes ?? null,
        dealId: input.dealId ?? null,
        clientId: input.clientId ?? null,
        contactId: input.contactId ?? null,
        actorId: input.actorId ?? null,
        metadata: input.metadata,
      },
    });
    if (input.dealId) {
      await db.crmDeal.update({
        where: { id: input.dealId },
        data: { lastActivityAt: occurredAt },
      });
    }
  }

  async list(query: ListActivitiesQueryDto): Promise<CrmActivityItem[]> {
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
    const where: Prisma.CrmActivityWhereInput = {};
    if (query.dealId) where.dealId = query.dealId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.contactId) where.contactId = query.contactId;

    const rows = await this.prisma.crmActivity.findMany({
      where,
      include: ACTIVITY_INCLUDE,
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return rows.map((row) => this.serialize(row));
  }

  async create(
    dto: CreateActivityDto,
    userId: string,
  ): Promise<CrmActivityItem> {
    let clientId = dto.clientId ?? null;
    let contactId = dto.contactId ?? null;
    if (dto.dealId) {
      const deal = await this.prisma.crmDeal.findUnique({
        where: { id: dto.dealId },
        select: { clientId: true, contactId: true },
      });
      if (!deal) throw new NotFoundException('Negocio no encontrado');
      clientId ??= deal.clientId;
      contactId ??= deal.contactId;
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.crmActivity.create({
        data: {
          type: dto.type,
          subject: dto.subject?.trim() || null,
          body: dto.body?.trim() || null,
          occurredAt,
          durationMinutes: dto.durationMinutes ?? null,
          dealId: dto.dealId ?? null,
          clientId,
          contactId,
          actorId: userId,
        },
        include: ACTIVITY_INCLUDE,
      });
      if (dto.dealId) {
        await tx.crmDeal.update({
          where: { id: dto.dealId },
          data: { lastActivityAt: occurredAt },
        });
      }
      return row;
    });
    return this.serialize(created);
  }

  async remove(id: string, userId: string): Promise<{ deleted: true }> {
    const row = await this.prisma.crmActivity.findUnique({
      where: { id },
      select: { actorId: true, type: true },
    });
    if (!row) throw new NotFoundException('Actividad no encontrada');
    if (!MANUAL_TYPES.includes(row.type) || row.actorId !== userId) {
      throw new ForbiddenException(
        'Solo puedes eliminar notas, llamadas o reuniones que registraste tú',
      );
    }
    await this.prisma.crmActivity.delete({ where: { id } });
    return { deleted: true };
  }

  private serialize(row: ActivityRow): CrmActivityItem {
    return {
      id: row.id,
      type: row.type,
      subject: row.subject,
      body: row.body,
      occurredAt: row.occurredAt.toISOString(),
      durationMinutes: row.durationMinutes,
      deal: row.deal,
      clientId: row.clientId,
      contact: row.contact,
      actor: row.actor,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
