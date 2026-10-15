import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  type AgentIssueSeverity,
  AgentIssueStatus,
  type NotificationPriority,
  type Prisma,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ListAgentIssuesQueryDto,
  UpdateAgentIssueDto,
} from './dto/agent-issues.dto.js';

export const DEVELOPER_SUB_ROLE = 'DESARROLLADOR';

const TICKET_PREFIX = 'NX';
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const CLOSED_STATUSES: AgentIssueStatus[] = [
  AgentIssueStatus.RESOLVED,
  AgentIssueStatus.DISMISSED,
];

const NOTIFICATION_PRIORITY: Record<AgentIssueSeverity, NotificationPriority> =
  {
    CRITICAL: 'HIGH',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  };

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const LIST_SELECT = {
  id: true,
  number: true,
  status: true,
  severity: true,
  title: true,
  summary: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  reporter: { select: USER_SELECT },
} as const;

export function formatTicketNumber(number: number): string {
  return `${TICKET_PREFIX}-${String(number).padStart(4, '0')}`;
}

function parseTicketNumber(value: string): number | undefined {
  const match = new RegExp(`^(?:${TICKET_PREFIX}-?)?0*(\\d{1,9})$`, 'i').exec(
    value.trim(),
  );
  return match ? Number(match[1]) : undefined;
}

export interface CreateAgentIssueInput {
  severity: AgentIssueSeverity;
  title: string;
  summary: string;
  technicalDetails: string;
  userRequest: string;
  stepsToReproduce: string[];
  expectedBehavior?: string;
  diagnostics: Prisma.InputJsonValue;
  context: Prisma.InputJsonValue;
  threadId?: string;
  reporterId: string;
}

@Injectable()
export class AgentIssuesService {
  private readonly logger = new Logger(AgentIssuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(input: CreateAgentIssueInput) {
    const issue = await this.prisma.agentIssue.create({
      data: input,
      select: { id: true, number: true, title: true, severity: true },
    });
    const ticket = formatTicketNumber(issue.number);

    try {
      await this.notifications.createForSubRole(
        DEVELOPER_SUB_ROLE,
        `Nexo reportó el ticket ${ticket}: ${issue.title}`,
        NOTIFICATION_PRIORITY[issue.severity],
        { href: '/dashboard/desarrollo' },
      );
    } catch (error) {
      this.logger.error(`Failed to notify developers of ${ticket}`, error);
    }

    return { id: issue.id, ticket };
  }

  async list(query: ListAgentIssuesQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Number(query.pageSize) || DEFAULT_PAGE_SIZE,
    );
    const filters: Prisma.AgentIssueWhereInput = {
      ...(query.severity ? { severity: query.severity } : {}),
      ...buildSearchWhere(query.search),
    };
    const where: Prisma.AgentIssueWhereInput = {
      ...filters,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, total, byStatus] = await Promise.all([
      this.prisma.agentIssue.findMany({
        where,
        orderBy: { number: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: LIST_SELECT,
      }),
      this.prisma.agentIssue.count({ where }),
      this.prisma.agentIssue.groupBy({
        by: ['status'],
        where: filters,
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(
      Object.values(AgentIssueStatus).map((status) => [
        status,
        byStatus.find((g) => g.status === status)?._count._all ?? 0,
      ]),
    ) as Record<AgentIssueStatus, number>;

    return {
      data: rows.map((row) => ({
        ...row,
        ticket: formatTicketNumber(row.number),
      })),
      total,
      page,
      pageSize,
      counts,
    };
  }

  async findOne(id: string) {
    const issue = await this.prisma.agentIssue.findUnique({
      where: { id },
      include: {
        reporter: { select: USER_SELECT },
        resolvedBy: { select: USER_SELECT },
      },
    });
    if (!issue) throw new NotFoundException('Ticket no encontrado');
    return { ...issue, ticket: formatTicketNumber(issue.number) };
  }

  async update(id: string, dto: UpdateAgentIssueDto, actorId: string) {
    const current = await this.prisma.agentIssue.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new NotFoundException('Ticket no encontrado');

    const closing =
      dto.status !== undefined &&
      CLOSED_STATUSES.includes(dto.status) &&
      !CLOSED_STATUSES.includes(current.status);
    const reopening =
      dto.status !== undefined && !CLOSED_STATUSES.includes(dto.status);

    await this.prisma.agentIssue.update({
      where: { id },
      data: {
        status: dto.status,
        severity: dto.severity,
        resolutionNotes: dto.resolutionNotes,
        ...(closing ? { resolvedAt: new Date(), resolvedById: actorId } : {}),
        ...(reopening ? { resolvedAt: null, resolvedById: null } : {}),
      },
    });
    return this.findOne(id);
  }
}

function buildSearchWhere(
  search: string | undefined,
): Prisma.AgentIssueWhereInput {
  const term = search?.trim();
  if (!term) return {};
  const number = parseTicketNumber(term);
  return {
    OR: [
      ...(number !== undefined ? [{ number }] : []),
      { title: { contains: term, mode: 'insensitive' } },
      { summary: { contains: term, mode: 'insensitive' } },
      { userRequest: { contains: term, mode: 'insensitive' } },
    ],
  };
}
