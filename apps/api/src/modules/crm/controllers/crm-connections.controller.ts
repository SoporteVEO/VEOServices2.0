import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  CurrentUser,
  Public,
  RequiredSubRoles,
} from '../../auth/decorators.js';
import { CrmConnectionsService } from '../crm-connections.service.js';
import { CRM_SUB_ROLE, type CrmAuthUser } from '../crm.constants.js';
import {
  ConnectWhatsAppDto,
  UpdateEmailSignatureDto,
} from '../dto/crm-connection.dto.js';

@Controller('crm/connections')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmConnectionsController {
  constructor(private readonly connections: CrmConnectionsService) {}

  @Get()
  async status(@CurrentUser() user: CrmAuthUser) {
    const data = await this.connections.status(user.id);
    return { data };
  }

  @Get('gmail/auth-url')
  gmailAuthUrl(@CurrentUser() user: CrmAuthUser) {
    return { data: this.connections.gmailAuthUrl(user) };
  }

  /** Google redirects the browser here; the signed `state` identifies the user. */
  @Public()
  @Get('gmail/callback')
  async gmailCallback(
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    const redirectTo = await this.connections.handleGmailCallback({
      code,
      state,
      error,
    });
    res.redirect(302, redirectTo);
  }

  @Put('gmail/signature')
  async updateSignature(
    @Body() dto: UpdateEmailSignatureDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.connections.updateSignature(user.id, dto.signature);
    return { data };
  }

  @Delete('gmail')
  async disconnectGmail(@CurrentUser() user: CrmAuthUser) {
    return this.connections.disconnectGmail(user.id);
  }

  @Post('whatsapp')
  async connectWhatsApp(
    @Body() dto: ConnectWhatsAppDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.connections.connectWhatsApp(user.id, dto);
    return { data };
  }

  @Delete('whatsapp')
  async disconnectWhatsApp(@CurrentUser() user: CrmAuthUser) {
    return this.connections.disconnectWhatsApp(user.id);
  }
}
