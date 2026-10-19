import { Injectable, Logger } from '@nestjs/common';
import {
  type NotificationPriority,
  NotificationsService,
} from '../notifications/notifications.service.js';
import { DEVELOPER_SUB_ROLE } from './feature-requests.constants.js';

/** Notifications never block the action that triggered them. */
@Injectable()
export class FeatureRequestNotifier {
  private readonly logger = new Logger(FeatureRequestNotifier.name);

  constructor(private readonly notifications: NotificationsService) {}

  async toDevelopers(
    description: string,
    href: string,
    priority: NotificationPriority = 'MEDIUM',
    excludeUserId?: string,
  ) {
    try {
      await this.notifications.createForSubRole(
        DEVELOPER_SUB_ROLE,
        description,
        priority,
        { href, excludeUserId },
      );
    } catch (error) {
      this.logger.error('Failed to notify developers', error);
    }
  }

  async toUsers(
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
      this.logger.error('Failed to notify users', error);
    }
  }
}
