import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FeatureRequestEventType,
  FeatureRequestStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ListFeatureRequestsQueryDto,
  UpdateFeatureRequestStatusDto,
} from './dto/feature-requests.dto.js';
import { FeatureRequestNotifier } from './feature-request-notifier.js';
import { toListItem } from './feature-request.mapper.js';
import {
  LIST_SELECT,
  type FeatureRequestViewer,
} from './feature-request.selects.js';
import {
  STATUS_LABELS,
  formatTicketNumber,
  parseTicketNumber,
  userRequestHref,
} from './feature-requests.constants.js';
import { FeatureRequestsService } from './feature-requests.service.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function buildSearchWhere(
  search: string | undefined,
): Prisma.FeatureRequestWhereInput {
  const term = search?.trim();
  if (!term) return {};
  const number = parseTicketNumber(term);
  return {
    OR: [
      ...(number !== undefined ? [{ number }] : []),
      { title: { contains: term, mode: 'insensitive' } },
      { summary: { contains: term, mode: 'insensitive' } },
      { requester: { firstName: { contains: term, mode: 'insensitive' } } },
      { requester: { lastName: { contains: term, mode: 'insensitive' } } },
      { requester: { email: { contains: term, mode: 'insensitive' } } },
    ],
  };
}

@Injectable()
export class FeatureRequestsDevService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: FeatureRequestNotifier,
    private readonly requests: FeatureRequestsService,
  ) {}

  async list(query: ListFeatureRequestsQueryDto, viewerId: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Number(query.pageSize) || DEFAULT_PAGE_SIZE,
    );
    const filters: Prisma.FeatureRequestWhereInput = {
      ...(query.priority ? { priority: query.priority } : {}),
      ...buildSearchWhere(query.search),
    };
    const where: Prisma.FeatureRequestWhereInput = {
      ...filters,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, total, byStatus] = await Promise.all([
      this.prisma.featureRequest.findMany({
        where,
        orderBy: { number: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: LIST_SELECT,
      }),
      this.prisma.featureRequest.count({ where }),
      this.prisma.featureRequest.groupBy({
        by: ['status'],
        where: filters,
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(
      Object.values(FeatureRequestStatus).map((status) => [
        status,
        byStatus.find((g) => g.status === status)?._count._all ?? 0,
      ]),
    ) as Record<FeatureRequestStatus, number>;

    return {
      data: rows.map((row) => toListItem(row, viewerId)),
      total,
      page,
      pageSize,
      counts,
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateFeatureRequestStatusDto,
    viewer: FeatureRequestViewer,
  ) {
    const row = await this.prisma.featureRequest.findUnique({
      where: { id },
      select: {
        number: true,
        title: true,
        status: true,
        requester: { select: { id: true } },
        collaborators: { select: { userId: true } },
      },
    });
    if (!row) throw new NotFoundException('Solicitud no encontrada');
    if (row.status === FeatureRequestStatus.APPROVED) {
      throw new BadRequestException(
        'La solicitud ya fue aprobada y no admite cambios',
      );
    }

    const message = dto.message?.trim() || undefined;
    if (dto.status === FeatureRequestStatus.REJECTED && !message) {
      throw new BadRequestException('Explica el motivo del rechazo');
    }
    const unchanged = dto.status === row.status;
    if (unchanged && !message) {
      throw new BadRequestException('La solicitud ya tiene ese estado');
    }

    const completing =
      !unchanged && dto.status === FeatureRequestStatus.COMPLETED;
    await this.prisma.$transaction(async (tx) => {
      if (!unchanged) {
        await tx.featureRequest.update({
          where: { id },
          data: {
            status: dto.status,
            completedAt: completing ? new Date() : null,
            ...(completing ? { completionRound: { increment: 1 } } : {}),
          },
        });
      }
      await tx.featureRequestEvent.create({
        data: {
          requestId: id,
          type: unchanged
            ? FeatureRequestEventType.COMMENT
            : FeatureRequestEventType.STATUS_CHANGED,
          fromStatus: unchanged ? null : row.status,
          toStatus: unchanged ? null : dto.status,
          message,
          actorUserId: viewer.id,
        },
      });
    });

    const ticket = formatTicketNumber(row.number);
    const recipients = [
      row.requester.id,
      ...row.collaborators.map((c) => c.userId),
    ].filter((userId) => userId !== viewer.id);
    const note = message ? `: ${message}` : '';
    const description = completing
      ? `${ticket} está completada. Revisa la funcionalidad y firma tu aprobación.`
      : unchanged
        ? `El equipo de desarrollo comentó en ${ticket}${note}`
        : `${ticket} cambió a «${STATUS_LABELS[dto.status]}»${note}`;
    const urgent = completing || dto.status === FeatureRequestStatus.REJECTED;
    await this.notifier.toUsers(
      recipients,
      description,
      userRequestHref(id),
      urgent ? 'HIGH' : 'MEDIUM',
    );

    return this.requests.getDetail(id, viewer);
  }
}
