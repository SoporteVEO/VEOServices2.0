import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../auth/decorators.js';
import {
  CrmMessagesService,
  type WhatsAppWebhookPayload,
} from '../crm-messages.service.js';
import { WhatsAppClient } from '../integrations/whatsapp.client.js';

/** Meta Cloud API webhook: inbound messages and delivery receipts. */
@Public()
@Controller('crm/whatsapp/webhook')
export class CrmWhatsAppWebhookController {
  private readonly logger = new Logger(CrmWhatsAppWebhookController.name);

  constructor(
    private readonly messages: CrmMessagesService,
    private readonly whatsapp: WhatsAppClient,
  ) {}

  @Get()
  verify(
    @Res() res: Response,
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    const expected = this.whatsapp.webhookVerifyToken;
    if (mode === 'subscribe' && expected && token === expected && challenge) {
      res.status(200).type('text/plain').send(challenge);
      return;
    }
    res.sendStatus(403);
  }

  @Post()
  @HttpCode(200)
  async receive(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() payload: WhatsAppWebhookPayload,
  ) {
    if (!this.whatsapp.isValidSignature(req.rawBody, signature)) {
      throw new ForbiddenException('Firma inválida');
    }
    try {
      await this.messages.handleWhatsAppWebhook(payload);
    } catch (error) {
      this.logger.error(`Webhook de WhatsApp falló: ${String(error)}`);
    }
    return { received: true };
  }
}
