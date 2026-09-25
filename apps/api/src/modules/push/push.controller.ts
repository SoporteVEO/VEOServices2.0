import { Body, Controller, Delete, Get, HttpCode, Post } from '@nestjs/common';
import {
  AllowFieldRoles,
  AllowLimited,
  CurrentUser,
} from '../auth/decorators.js';
import { FIELD_ROLES } from '../auth/field-roles.js';
import {
  RemovePushSubscriptionDto,
  SavePushSubscriptionDto,
} from './dto/push-subscription.dto.js';
import { PushService } from './push.service.js';

interface AuthUser {
  id: string;
}

@AllowLimited()
@AllowFieldRoles(...FIELD_ROLES)
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('public-key')
  getPublicKey() {
    return { data: { publicKey: this.pushService.getPublicKey() } };
  }

  @Post('subscriptions')
  @HttpCode(204)
  async subscribe(
    @CurrentUser() user: AuthUser,
    @Body() dto: SavePushSubscriptionDto,
  ) {
    await this.pushService.saveSubscription(user.id, {
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      userAgent: dto.userAgent,
    });
  }

  @Delete('subscriptions')
  @HttpCode(204)
  async unsubscribe(
    @CurrentUser() user: AuthUser,
    @Body() dto: RemovePushSubscriptionDto,
  ) {
    await this.pushService.removeSubscription(user.id, dto.endpoint);
  }

  @Post('test')
  @HttpCode(204)
  async sendTest(@CurrentUser() user: AuthUser) {
    await this.pushService.sendToUser(user.id, {
      title: 'Notificaciones activadas',
      body: 'Recibirás un aviso cuando se te asigne una orden.',
      url: '/portal',
      tag: 'push-test',
    });
  }
}
