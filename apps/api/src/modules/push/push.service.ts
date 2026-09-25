import { Injectable, Logger } from '@nestjs/common';
import webpush, { WebPushError } from 'web-push';
import { PrismaService } from '../prisma/prisma.service.js';

export interface PushPayload {
  title: string;
  body: string;
  /** Path inside the app opened when the notification is tapped. */
  url: string;
  /** Notifications sharing a tag replace each other on the device. */
  tag?: string;
}

export interface SavePushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

/** Push services answer 404/410 once a device unsubscribed or the app was removed. */
const EXPIRED_SUBSCRIPTION_STATUS = new Set([404, 410]);
const PUSH_TTL_SECONDS = 60 * 60 * 24;

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly publicKey = process.env.VAPID_PUBLIC_KEY ?? null;
  private readonly enabled: boolean;

  constructor(private readonly prisma: PrismaService) {
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject =
      process.env.VAPID_SUBJECT ?? 'mailto:soporte.dev@arhedes.com.sv';
    this.enabled = Boolean(this.publicKey && privateKey);

    if (this.enabled) {
      webpush.setVapidDetails(subject, this.publicKey!, privateKey!);
    } else {
      this.logger.warn(
        'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set: push notifications are disabled.',
      );
    }
  }

  getPublicKey(): string | null {
    return this.enabled ? this.publicKey : null;
  }

  async saveSubscription(userId: string, input: SavePushSubscriptionInput) {
    // A device that changes hands (shared phone, new login) moves to the new user.
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
      },
      update: {
        userId,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  async removeSubscription(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  /**
   * Fire-and-forget from callers: a failed push must never roll back the
   * assignment that triggered it, so errors are logged and swallowed here.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return;

    try {
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId },
      });
      if (subscriptions.length === 0) return;

      const body = JSON.stringify(payload);
      const expiredIds: string[] = [];
      const deliveredIds: string[] = [];

      await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              body,
              { TTL: PUSH_TTL_SECONDS, urgency: 'high' },
            );
            deliveredIds.push(sub.id);
          } catch (error) {
            if (
              error instanceof WebPushError &&
              EXPIRED_SUBSCRIPTION_STATUS.has(error.statusCode)
            ) {
              expiredIds.push(sub.id);
              return;
            }
            this.logger.warn(
              `Push delivery failed for subscription ${sub.id}: ${String(error)}`,
            );
          }
        }),
      );

      await Promise.all([
        expiredIds.length > 0
          ? this.prisma.pushSubscription.deleteMany({
              where: { id: { in: expiredIds } },
            })
          : null,
        deliveredIds.length > 0
          ? this.prisma.pushSubscription.updateMany({
              where: { id: { in: deliveredIds } },
              data: { lastUsedAt: new Date() },
            })
          : null,
      ]);
    } catch (error) {
      this.logger.error(`Push to user ${userId} failed: ${String(error)}`);
    }
  }
}
