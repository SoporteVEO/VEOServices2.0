import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PushService, type PushPayload } from '../push/push.service.js';

const PUSH_TITLE = 'Veo Services';
const DEFAULT_PUSH_URL = '/dashboard';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type UserNotificationStatus = 'PENDING' | 'VIEWED' | 'DELETED';

const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  status: true,
  description: true,
  priority: true,
  href: true,
  createdAt: true,
  updatedAt: true,
} as const;

type NotificationRow = {
  id: string;
  userId: string;
  status: UserNotificationStatus;
  description: string;
  priority: NotificationPriority;
  href: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateNotificationInput {
  userId: string;
  description: string;
  priority?: NotificationPriority;
  href?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** Mirrors in-app notifications to the users' browsers; never blocks or fails the caller. */
  private pushToBrowsers(inputs: CreateNotificationInput[]) {
    const groups = new Map<
      string,
      { userIds: string[]; payload: PushPayload }
    >();

    for (const input of inputs) {
      const url = input.href ?? DEFAULT_PUSH_URL;
      const key = `${url}\u0000${input.description}`;
      const group = groups.get(key);
      if (group) {
        group.userIds.push(input.userId);
        continue;
      }
      groups.set(key, {
        userIds: [input.userId],
        payload: { title: PUSH_TITLE, body: input.description, url },
      });
    }

    for (const { userIds, payload } of groups.values()) {
      void this.push.sendToUsers(userIds, payload);
    }
  }

  private serialize(row: NotificationRow) {
    return {
      id: row.id,
      userId: row.userId,
      status: row.status,
      description: row.description,
      priority: row.priority,
      href: row.href,
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
        href: input.href,
      },
      select: NOTIFICATION_SELECT,
    });
    this.pushToBrowsers([input]);
    return this.serialize(created as NotificationRow);
  }

  async createMany(inputs: CreateNotificationInput[]) {
    if (inputs.length === 0) return { count: 0 };
    const result = await this.prisma.notification.createMany({
      data: inputs.map((i) => ({
        userId: i.userId,
        description: i.description,
        priority: i.priority ?? 'MEDIUM',
        href: i.href,
      })),
    });
    this.pushToBrowsers(inputs);
    return { count: result.count };
  }

  async createForSubRole(
    subRole:
      | 'HR'
      | 'USERS_MANAGEMENT'
      | 'PRODUCTION'
      | 'MANTENIMIENTO'
      | 'PANTALLAS_PRODUCCION'
      | 'PANTALLAS_COMERCIAL'
      | 'DESARROLLADOR'
      | 'VENTAS'
      | 'CONTABILIDAD'
      | 'FINANZAS'
      | 'FACTURACION',
    description: string,
    priority: NotificationPriority = 'MEDIUM',
    options: { excludeUserId?: string; href?: string } = {},
  ) {
    const { excludeUserId, href } = options;
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
      users.map((u) => ({ userId: u.id, description, priority, href })),
    );

    return { count: users.length, userIds: users.map((u) => u.id) };
  }

  async createForAllUsers(
    description: string,
    priority: NotificationPriority = 'MEDIUM',
    href?: string,
  ) {
    const users = await this.prisma.user.findMany({
      where: { disabled: false },
      select: { id: true },
    });
    return this.createMany(
      users.map((u) => ({ userId: u.id, description, priority, href })),
    );
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
