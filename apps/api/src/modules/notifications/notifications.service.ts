import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type UserNotificationStatus = 'PENDING' | 'VIEWED' | 'DELETED';

const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  status: true,
  description: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
} as const;

type NotificationRow = {
  id: string;
  userId: string;
  status: UserNotificationStatus;
  description: string;
  priority: NotificationPriority;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateNotificationInput {
  userId: string;
  description: string;
  priority?: NotificationPriority;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(row: NotificationRow) {
    return {
      id: row.id,
      userId: row.userId,
      status: row.status,
      description: row.description,
      priority: row.priority,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async createOne(input: CreateNotificationInput) {
    const created = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        description: input.description,
        priority: input.priority ?? 'MEDIUM',
      },
      select: NOTIFICATION_SELECT,
    });
    return this.serialize(created as NotificationRow);
  }

  async createMany(inputs: CreateNotificationInput[]) {
    if (inputs.length === 0) return { count: 0 };
    const result = await this.prisma.notification.createMany({
      data: inputs.map((i) => ({
        userId: i.userId,
        description: i.description,
        priority: i.priority ?? 'MEDIUM',
      })),
    });
    return { count: result.count };
  }

  async createForSubRole(
    subRole: 'HR' | 'USERS_MANAGEMENT',
    description: string,
    priority: NotificationPriority = 'MEDIUM',
    excludeUserId?: string,
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        disabled: false,
        subRoles: { has: subRole },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (users.length === 0) return { count: 0, userIds: [] };

    await this.createMany(
      users.map((u) => ({ userId: u.id, description, priority })),
    );

    return { count: users.length, userIds: users.map((u) => u.id) };
  }

  async findActiveByUser(userId: string) {
    const rows = await this.prisma.notification.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'VIEWED'] },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      select: NOTIFICATION_SELECT,
    });
    return rows.map((row) => this.serialize(row as NotificationRow));
  }

  async countPendingByUser(userId: string) {
    return this.prisma.notification.count({
      where: { userId, status: 'PENDING' },
    });
  }

  async updateStatus(
    userId: string,
    id: string,
    status: UserNotificationStatus,
  ) {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });
    if (!existing) throw new NotFoundException('Notificación no encontrada');
    if (existing.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar esta notificación',
      );
    }

    if (existing.status === status) {
      const current = await this.prisma.notification.findUnique({
        where: { id },
        select: NOTIFICATION_SELECT,
      });
      return this.serialize(current as NotificationRow);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { status },
      select: NOTIFICATION_SELECT,
    });
    return this.serialize(updated as NotificationRow);
  }

  async markAllViewed(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, status: 'PENDING' },
      data: { status: 'VIEWED' },
    });
    return { count: result.count };
  }

  async remove(userId: string, id: string) {
    return this.updateStatus(userId, id, 'DELETED');
  }
}
