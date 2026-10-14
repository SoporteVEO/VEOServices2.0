import { Injectable, NotFoundException } from '@nestjs/common';
import { AgentFeedbackReview, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgentLearningsService } from './agent-learnings.service.js';
import type {
  ListAgentFeedbackQueryDto,
  ReviewAgentFeedbackDto,
} from './dto/agent-learnings.dto.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const LIST_SELECT = {
  id: true,
  rating: true,
  reason: true,
  comment: true,
  question: true,
  review: true,
  createdAt: true,
  updatedAt: true,
  user: { select: USER_SELECT },
  _count: { select: { learnings: true } },
} as const;

@Injectable()
export class AgentFeedbackReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learnings: AgentLearningsService,
  ) {}

  async list(query: ListAgentFeedbackQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Number(query.pageSize) || DEFAULT_PAGE_SIZE,
    );
    const term = query.search?.trim();
    const filters: Prisma.AgentFeedbackWhereInput = {
      ...(query.rating ? { rating: query.rating } : {}),
      ...(term
        ? {
            OR: [
              { question: { contains: term, mode: 'insensitive' } },
              { comment: { contains: term, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const where: Prisma.AgentFeedbackWhereInput = {
      ...filters,
      ...(query.review ? { review: query.review } : {}),
    };

    const [data, total, byReview] = await Promise.all([
      this.prisma.agentFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: LIST_SELECT,
      }),
      this.prisma.agentFeedback.count({ where }),
      this.prisma.agentFeedback.groupBy({
        by: ['review'],
        where: filters,
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(
      Object.values(AgentFeedbackReview).map((review) => [
        review,
        byReview.find((g) => g.review === review)?._count._all ?? 0,
      ]),
    ) as Record<AgentFeedbackReview, number>;

    return {
      data: data.map(({ _count, ...row }) => ({
        ...row,
        learningCount: _count.learnings,
      })),
      total,
      page,
      pageSize,
      counts,
    };
  }

  async findOne(id: string) {
    const feedback = await this.prisma.agentFeedback.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        reviewedBy: { select: USER_SELECT },
        learnings: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, content: true, status: true, createdAt: true },
        },
      },
    });
    if (!feedback) throw new NotFoundException('Calificación no encontrada');
    return feedback;
  }

  async review(id: string, dto: ReviewAgentFeedbackDto, actorId: string) {
    const pending = dto.review === AgentFeedbackReview.PENDING;
    const { count } = await this.prisma.agentFeedback.updateMany({
      where: { id },
      data: {
        review: dto.review,
        reviewedById: pending ? null : actorId,
        reviewedAt: pending ? null : new Date(),
      },
    });
    if (count === 0) throw new NotFoundException('Calificación no encontrada');

    if (dto.review === AgentFeedbackReview.DISMISSED) {
      await this.learnings.rejectPendingFromFeedback(id, actorId);
    }
    return this.findOne(id);
  }
}
