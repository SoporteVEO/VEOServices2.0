import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AllowLimited, CurrentUser } from '../auth/decorators.js';
import { NotificationsService } from './notifications.service.js';
import { UpdateNotificationStatusDto } from './dto/update-notification-status.dto.js';

interface AuthUser {
  id: string;
}

@AllowLimited()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findActive(@CurrentUser() user: AuthUser) {
    const notifications = await this.notificationsService.findActiveByUser(
      user.id,
    );
    const pendingCount = notifications.filter(
      (n) => n.status === 'PENDING',
    ).length;
    return { data: notifications, pendingCount };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationStatusDto,
  ) {
    const updated = await this.notificationsService.updateStatus(
      user.id,
      id,
      dto.status,
    );
    return { data: updated };
  }

  @Post('mark-all-viewed')
  @HttpCode(200)
  async markAllViewed(@CurrentUser() user: AuthUser) {
    const result = await this.notificationsService.markAllViewed(user.id);
    return { data: result };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const updated = await this.notificationsService.remove(user.id, id);
    return { data: updated };
  }
}
