import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service.js';
import {
  type NotificationPriority,
  NotificationsService,
} from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { MentorshipEmail } from './mentorship-emails.js';
import { HR_SUB_ROLE } from './mentorships.constants.js';

export interface Recipient {
  userId: string;
  name: string;
  email: string;
}

function webAppUrl(): string {
  const fallback = (
    process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000'
  ).split(',')[0];
  return (process.env.WEB_APP_URL ?? fallback).replace(/\/$/, '');
}

/** Notifications never block or fail the action that triggered them. */
@Injectable()
export class MentorshipNotifier {
  private readonly logger = new Logger(MentorshipNotifier.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  url(path: string): string {
    return `${webAppUrl()}${path}`;
  }

  async inApp(
    userIds: string[],
    description: string,
    href: string,
    priority: NotificationPriority = 'MEDIUM',
  ) {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return;
    try {
      await this.notifications.createMany(
        unique.map((userId) => ({ userId, description, priority, href })),
      );
    } catch (error) {
      this.logger.error('Failed to create mentorship notifications', error);
    }
  }

  async sendEmail(to: string, email: MentorshipEmail) {
    try {
      await this.email.sendEmail(to, email.subject, email.html);
    } catch (error) {
      this.logger.error(`Failed to send mentorship email to ${to}`, error);
    }
  }

  async recipient(userId: string): Promise<Recipient | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        disabled: true,
        teamMember: { select: { fullName: true, businessEmail: true } },
      },
    });
    if (!user || user.disabled) return null;
    return {
      userId: user.id,
      name:
        user.teamMember?.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.teamMember?.businessEmail || user.email,
    };
  }

  async hrRecipients(): Promise<Recipient[]> {
    const users = await this.prisma.user.findMany({
      where: { disabled: false, subRoles: { has: HR_SUB_ROLE } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        teamMember: { select: { fullName: true, businessEmail: true } },
      },
    });
    return users.map((user) => ({
      userId: user.id,
      name:
        user.teamMember?.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.teamMember?.businessEmail || user.email,
    }));
  }
}
