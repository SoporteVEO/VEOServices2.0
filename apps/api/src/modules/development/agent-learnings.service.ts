import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type AgentLearningSource,
  AgentLearningStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateAgentLearningDto,
  ListAgentLearningsQueryDto,
  UpdateAgentLearningDto,
} from './dto/agent-learnings.dto.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const PROMPT_ACTIVE_LIMIT = 200;
const PROMPT_OWN_PENDING_LIMIT = 15;

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const LEARNING_INCLUDE = {
  proposedBy: { select: USER_SELECT },
  reviewedBy: { select: USER_SELECT },
  feedback: {
    select: { id: true, rating: true, reason: true, question: true },
  },
} as const;

export interface ProposeLearningInput {
  content: string;
  example?: string;
  source: AgentLearningSource;
  feedbackId?: string;
  threadId?: string;
  proposedById?: string;
}

export interface PromptLearning {
  id: string;
  content: string;
  status: AgentLearningStatus;
  updatedAt: Date;
}

@Injectable()
export class AgentLearningsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Stores a lesson for review, reusing an identical one that is not rejected. */
  async propose(input: ProposeLearningInput) {
    const content = input.content.trim();
    const existing = await this.prisma.agentLearning.findFirst({
      where: {
        content: { equals: content, mode: 'insensitive' },
        status: { not: AgentLearningStatus.REJECTED },
      },
      select: { id: true, status: true },
    });
    if (existing) return existing;

    return this.prisma.agentLearning.create({
      data: { ...input, content, status: AgentLearningStatus.PENDING },
      select: { id: true, status: true },
    });
  }

  /** Active lessons for everyone plus the unreviewed ones this user taught. */
  forPrompt(userId: string): Promise<PromptLearning[]> {
    const select = {
      id: true,
      content: true,
      status: true,
      updatedAt: true,
    } as const;
    return Promise.all([
      this.prisma.agentLearning.findMany({
        where: { status: AgentLearningStatus.ACTIVE },
        orderBy: { updatedAt: 'desc' },
        take: PROMPT_ACTIVE_LIMIT,
        select,
      }),
      this.prisma.agentLearning.findMany({
        where: { status: AgentLearningStatus.PENDING, proposedById: userId },
        orderBy: { updatedAt: 'desc' },
        take: PROMPT_OWN_PENDING_LIMIT,
        select,
      }),
    ]).then(([active, pending]) => [...active, ...pending]);
  }

  knownContents(): Promise<string[]> {
    return this.prisma.agentLearning
      .findMany({
        where: { status: { not: AgentLearningStatus.REJECTED } },
        orderBy: { updatedAt: 'desc' },
        take: 60,
        select: { content: true },
      })
      .then((rows) => rows.map((r) => r.content));
  }

  discardPendingFromFeedback(feedbackId: string) {
    return this.prisma.agentLearning.deleteMany({
      where: { feedbackId, status: AgentLearningStatus.PENDING },
    });
  }

  rejectPendingFromFeedback(feedbackId: string, actorId: string) {
    return this.prisma.agentLearning.updateMany({
      where: { feedbackId, status: AgentLearningStatus.PENDING },
      data: {
        status: AgentLearningStatus.REJECTED,
        reviewedById: actorId,
        reviewedAt: new Date(),
      },
    });
  }

  async list(query: ListAgentLearningsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Number(query.pageSize) || DEFAULT_PAGE_SIZE,
    );
    const term = query.search?.trim();
    const filters: Prisma.AgentLearningWhereInput = term
      ? {
          OR: [
            { content: { contains: term, mode: 'insensitive' } },
            { example: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {};
    const where: Prisma.AgentLearningWhereInput = {
      ...filters,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total, byStatus] = await Promise.all([
      this.prisma.agentLearning.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: LEARNING_INCLUDE,
      }),
      this.prisma.agentLearning.count({ where }),
      this.prisma.agentLearning.groupBy({
        by: ['status'],
        where: filters,
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(
      Object.values(AgentLearningStatus).map((status) => [
        status,
        byStatus.find((g) => g.status === status)?._count._all ?? 0,
      ]),
    ) as Record<AgentLearningStatus, number>;

    return { data, total, page, pageSize, counts };
  }

  create(dto: CreateAgentLearningDto, actorId: string) {
    return this.prisma.agentLearning.create({
      data: {
        content: dto.content.trim(),
        example: dto.example?.trim() || null,
        source: 'MANUAL',
        status: AgentLearningStatus.ACTIVE,
        proposedById: actorId,
        reviewedById: actorId,
        reviewedAt: new Date(),
      },
      include: LEARNING_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateAgentLearningDto, actorId: string) {
    const current = await this.prisma.agentLearning.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new NotFoundException('Aprendizaje no encontrado');

    const reviewed =
      dto.status !== undefined &&
      dto.status !== current.status &&
      dto.status !== AgentLearningStatus.PENDING;

    return this.prisma.agentLearning.update({
      where: { id },
      data: {
        content: dto.content?.trim(),
        status: dto.status,
        ...(reviewed ? { reviewedById: actorId, reviewedAt: new Date() } : {}),
        ...(dto.status === AgentLearningStatus.PENDING
          ? { reviewedById: null, reviewedAt: null }
          : {}),
      },
      include: LEARNING_INCLUDE,
    });
  }

  async remove(id: string) {
    const { count } = await this.prisma.agentLearning.deleteMany({
      where: { id },
    });
    if (count === 0) throw new NotFoundException('Aprendizaje no encontrado');
  }
}
