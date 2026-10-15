import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../../auth/decorators.js';
import { CrmConnectionsService } from '../crm-connections.service.js';
import { CrmMessagesService } from '../crm-messages.service.js';
import { CRM_SUB_ROLE, type CrmAuthUser } from '../crm.constants.js';
import {
  ListMessagesQueryDto,
  SendEmailDto,
  SendWhatsAppDto,
  SyncEmailDto,
} from '../dto/crm-message.dto.js';

@Controller('crm/messages')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmMessagesController {
  constructor(
    private readonly messages: CrmMessagesService,
    private readonly connections: CrmConnectionsService,
  ) {}

  @Get()
  async list(@Query() query: ListMessagesQueryDto) {
    const data = await this.messages.list(query);
    return { data };
  }

  @Post('email')
  async sendEmail(@Body() dto: SendEmailDto, @CurrentUser() user: CrmAuthUser) {
    const data = await this.messages.sendEmail(dto, user);
    return { data };
  }

  @Post('email/sync')
  async syncEmail(@Body() dto: SyncEmailDto, @CurrentUser() user: CrmAuthUser) {
    const data = await this.messages.syncEmail(dto, user);
    return { data };
  }

  @Post('whatsapp')
  async sendWhatsApp(
    @Body() dto: SendWhatsAppDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.messages.sendWhatsApp(dto, user);
    return { data };
  }

  @Get('whatsapp/templates')
  async whatsappTemplates(@CurrentUser() user: CrmAuthUser) {
    const data = await this.connections.whatsappTemplates(user.id);
    return { data };
  }
}
