import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type {
  CrmChannel,
  CrmMessageDirection,
  CrmMessageStatus,
  Prisma,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrmActivitiesService } from './crm-activities.service.js';
import { CrmConnectionsService } from './crm-connections.service.js';
import {
  applyTemplateVariables,
  renderEmailHtml,
} from './crm-template-render.js';
import { CrmTemplatesService } from './crm-templates.service.js';
import {
  USER_SUMMARY_SELECT,
  normalizePhone,
  type CrmAuthUser,
  type CrmUserSummary,
} from './crm.constants.js';
import type {
  ListMessagesQueryDto,
  SendEmailDto,
  SendWhatsAppDto,
  SyncEmailDto,
} from './dto/crm-message.dto.js';
import { GmailClient } from './integrations/gmail.client.js';
import { WhatsAppClient } from './integrations/whatsapp.client.js';

export interface CrmMessageItem {
  id: string;
  channel: CrmChannel;
  direction: CrmMessageDirection;
  status: CrmMessageStatus;
  toAddress: string;
  fromAddress: string | null;
  cc: string | null;
  subject: string | null;
  body: string;
  threadId: string | null;
  error: string | null;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  user: CrmUserSummary | null;
  deal: { id: string; title: string } | null;
  contact: { id: string; firstName: string; lastName: string | null } | null;
  template: { id: string; name: string } | null;
}

export interface SendWhatsAppResult {
  message: CrmMessageItem;
  waLink: string | null;
}

interface MessageContext {
  dealId: string | null;
  clientId: string | null;
  contactId: string | null;
}

interface WaInboundMessage {
  id: string;
  from: string;
  timestamp?: string;
  type: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
}

interface WaStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: string;
  errors?: { title?: string; message?: string }[];
}

export interface WhatsAppWebhookPayload {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: { wa_id: string; profile?: { name?: string } }[];
        messages?: WaInboundMessage[];
        statuses?: WaStatus[];
      };
    }[];
  }[];
}

const MESSAGE_INCLUDE = {
  user: { select: USER_SUMMARY_SELECT },
  deal: { select: { id: true, title: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  template: { select: { id: true, name: true } },
} as const satisfies Prisma.CrmMessageInclude;

type MessageRow = Prisma.CrmMessageGetPayload<{
  include: typeof MESSAGE_INCLUDE;
}>;

const STATUS_RANK: Record<CrmMessageStatus, number> = {
  FAILED: 0,
  RECEIVED: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3,
};

const WA_STATUS: Record<WaStatus['status'], CrmMessageStatus> = {
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED',
};

const MAX_SYNC_THREADS = 20;

function emailAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class CrmMessagesService {
  private readonly logger = new Logger(CrmMessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connections: CrmConnectionsService,
    private readonly templates: CrmTemplatesService,
    private readonly activities: CrmActivitiesService,
    private readonly notifications: NotificationsService,
    private readonly gmail: GmailClient,
    private readonly whatsapp: WhatsAppClient,
  ) {}

  async list(query: ListMessagesQueryDto): Promise<CrmMessageItem[]> {
    const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 300);
    const where: Prisma.CrmMessageWhereInput = {};
    if (query.channel) where.channel = query.channel;
    if (query.dealId) where.dealId = query.dealId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.contactId) where.contactId = query.contactId;

    const rows = await this.prisma.crmMessage.findMany({
      where,
      include: MESSAGE_INCLUDE,
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
    return rows.reverse().map((row) => this.serialize(row));
  }

  async sendEmail(
    dto: SendEmailDto,
    user: CrmAuthUser,
  ): Promise<CrmMessageItem> {
    const access = await this.connections.getGmailAccess(user.id);
    const ctx = await this.resolveContext(dto);
    const vars = await this.templates.context(ctx, user.id);
    const subject = applyTemplateVariables(dto.subject, vars).trim();
    const body = applyTemplateVariables(dto.body, vars);
    const html = await renderEmailHtml(body, access.signature);
    const text = access.signature ? `${body}\n\n--\n${access.signature}` : body;

    let inReplyTo: string | null = null;
    if (dto.threadId) {
      const thread = await this.gmail.getThread(
        access.accessToken,
        dto.threadId,
      );
      inReplyTo = thread.at(-1)?.messageIdHeader ?? null;
    }

    const testTo =
      process.env.NODE_ENV !== 'production'
        ? process.env.CRM_TEST_EMAIL_TO
        : undefined;
    const to = testTo ? [testTo] : dto.to;
    const cc = testTo ? [] : (dto.cc ?? []);
    const base = {
      channel: 'EMAIL' as const,
      direction: 'OUTBOUND' as const,
      userId: user.id,
      toAddress: dto.to.join(', '),
      fromAddress: access.email,
      cc: dto.cc?.length ? dto.cc.join(', ') : null,
      subject,
      body,
      bodyHtml: html,
      templateId: dto.templateId ?? null,
      ...ctx,
      metadata: testTo ? { redirectedTo: testTo } : undefined,
    };

    let sent: { id: string; threadId: string };
    try {
      const mime = this.gmail.buildMime({
        fromEmail: access.email,
        fromName: access.displayName,
        to,
        cc,
        subject,
        text,
        html,
        inReplyTo,
      });
      sent = await this.gmail.send(access.accessToken, mime, dto.threadId);
    } catch (error) {
      await this.prisma.crmMessage.create({
        data: { ...base, status: 'FAILED', error: errorMessage(error) },
      });
      throw error;
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const message = await tx.crmMessage.create({
        data: {
          ...base,
          status: 'SENT',
          externalId: sent.id,
          threadId: sent.threadId,
        },
        include: MESSAGE_INCLUDE,
      });
      await this.activities.log(
        {
          type: 'EMAIL',
          subject,
          body: body.slice(0, 500),
          ...ctx,
          actorId: user.id,
          metadata: {
            messageId: message.id,
            direction: 'OUTBOUND',
            to: base.toAddress,
          },
        },
        tx,
      );
      return message;
    });
    if (dto.templateId) await this.templates.markUsed(dto.templateId);
    return this.serialize(row);
  }

  /** Imports replies to threads this user started from the CRM. */
  async syncEmail(
    dto: SyncEmailDto,
    user: CrmAuthUser,
  ): Promise<{ imported: number }> {
    const access = await this.connections.getGmailAccess(user.id);
    const threads = await this.prisma.crmMessage.findMany({
      where: {
        channel: 'EMAIL',
        userId: user.id,
        threadId: { not: null },
        ...(dto.dealId ? { dealId: dto.dealId } : {}),
        ...(dto.clientId ? { clientId: dto.clientId } : {}),
        ...(dto.contactId ? { contactId: dto.contactId } : {}),
      },
      distinct: ['threadId'],
      orderBy: { sentAt: 'desc' },
      take: MAX_SYNC_THREADS,
      select: { threadId: true, dealId: true, clientId: true, contactId: true },
    });

    let imported = 0;
    for (const thread of threads) {
      const messages = await this.gmail.getThread(
        access.accessToken,
        thread.threadId!,
      );
      if (messages.length === 0) continue;
      const known = await this.prisma.crmMessage.findMany({
        where: {
          channel: 'EMAIL',
          externalId: { in: messages.map((m) => m.id) },
        },
        select: { externalId: true },
      });
      const knownIds = new Set(known.map((k) => k.externalId));
      const ctx = {
        dealId: thread.dealId,
        clientId: thread.clientId,
        contactId: thread.contactId,
      };

      for (const message of messages) {
        if (knownIds.has(message.id)) continue;
        const fromSelf = emailAddress(message.from) === access.email;
        const direction: CrmMessageDirection = fromSelf
          ? 'OUTBOUND'
          : 'INBOUND';
        await this.prisma.$transaction(async (tx) => {
          await tx.crmMessage.create({
            data: {
              channel: 'EMAIL',
              direction,
              status: fromSelf ? 'SENT' : 'RECEIVED',
              userId: user.id,
              toAddress: message.to,
              fromAddress: message.from,
              cc: message.cc,
              subject: message.subject,
              body: message.text || '(sin contenido de texto)',
              bodyHtml: message.html,
              externalId: message.id,
              threadId: message.threadId,
              sentAt: message.date,
              ...ctx,
            },
          });
          if (!fromSelf) {
            await this.activities.log(
              {
                type: 'EMAIL',
                subject: `Respuesta de ${message.from}`,
                body: message.text.slice(0, 500),
                occurredAt: message.date,
                ...ctx,
                metadata: { direction: 'INBOUND', threadId: message.threadId },
              },
              tx,
            );
          }
        });
        imported++;
      }
    }
    return { imported };
  }

  async sendWhatsApp(
    dto: SendWhatsAppDto,
    user: CrmAuthUser,
  ): Promise<SendWhatsAppResult> {
    const to = normalizePhone(dto.to);
    if (!to) throw new BadRequestException('Número de WhatsApp no válido');
    if (!dto.template && !dto.body?.trim()) {
      throw new BadRequestException('Escribe el mensaje o elige una plantilla');
    }
    const ctx = await this.resolveContext(dto);
    const vars = await this.templates.context(ctx, user.id);
    const body = applyTemplateVariables(dto.body ?? '', vars).trim();

    if (dto.mode === 'MANUAL') {
      if (dto.template) {
        throw new BadRequestException(
          'Las plantillas de WhatsApp solo se envían por la API',
        );
      }
      const row = await this.recordOutboundWhatsApp(
        { to, body, fromAddress: null, externalId: null, ctx, manual: true },
        user.id,
      );
      return {
        message: row,
        waLink: `https://wa.me/${to}?text=${encodeURIComponent(body)}`,
      };
    }

    const access = await this.connections.getWhatsAppAccess(user.id);
    if (!access) {
      throw new BadRequestException(
        'Conecta tu WhatsApp Business en CRM › Ajustes o usa "Abrir en WhatsApp"',
      );
    }
    const testTo =
      process.env.NODE_ENV !== 'production'
        ? normalizePhone(process.env.CRM_TEST_WHATSAPP_TO)
        : null;
    const recipient = testTo ?? to;
    const parameters =
      dto.template?.parameters.map((p) => applyTemplateVariables(p, vars)) ??
      [];
    const storedBody =
      body ||
      `[Plantilla ${dto.template?.name}] ${parameters.join(' · ')}`.trim();

    let externalId: string;
    try {
      externalId = dto.template
        ? await this.whatsapp.sendTemplate(
            access.phoneNumberId,
            access.accessToken,
            recipient,
            {
              name: dto.template.name,
              language: dto.template.language,
              parameters,
            },
          )
        : await this.whatsapp.sendText(
            access.phoneNumberId,
            access.accessToken,
            recipient,
            body,
          );
    } catch (error) {
      await this.prisma.crmMessage.create({
        data: {
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          status: 'FAILED',
          userId: user.id,
          toAddress: to,
          fromAddress: access.displayPhoneNumber,
          body: storedBody,
          error: errorMessage(error),
          ...ctx,
        },
      });
      throw error;
    }

    const row = await this.recordOutboundWhatsApp(
      {
        to,
        body: storedBody,
        fromAddress: access.displayPhoneNumber,
        externalId,
        ctx,
        manual: false,
        template: dto.template?.name,
      },
      user.id,
    );
    return { message: row, waLink: null };
  }

  async handleWhatsAppWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        if (!value || !phoneNumberId) continue;
        const owner = await this.connections.findWhatsAppOwner(phoneNumberId);
        if (!owner) continue;

        for (const message of value.messages ?? []) {
          const profileName = value.contacts?.find(
            (c) => c.wa_id === message.from,
          )?.profile?.name;
          try {
            await this.storeInboundWhatsApp(message, owner, profileName);
          } catch (error) {
            this.logger.error(
              `No se pudo guardar el WhatsApp ${message.id}: ${errorMessage(error)}`,
            );
          }
        }
        for (const status of value.statuses ?? []) {
          await this.applyWhatsAppStatus(status);
        }
      }
    }
  }

  private async storeInboundWhatsApp(
    message: WaInboundMessage,
    owner: { userId: string; accountLabel: string },
    profileName: string | undefined,
  ) {
    const exists = await this.prisma.crmMessage.count({
      where: { channel: 'WHATSAPP', externalId: message.id },
    });
    if (exists) return;

    const from = normalizePhone(message.from) ?? message.from;
    const text =
      message.text?.body ??
      message.button?.text ??
      message.interactive?.button_reply?.title ??
      message.interactive?.list_reply?.title ??
      `[${message.type}]`;
    const sentAt = message.timestamp
      ? new Date(Number(message.timestamp) * 1000)
      : new Date();

    const contact = await this.prisma.crmContact.findFirst({
      where: { whatsapp: from },
      select: { id: true, firstName: true, lastName: true, clientId: true },
    });
    const deal = contact
      ? await this.prisma.crmDeal.findFirst({
          where: {
            status: 'OPEN',
            OR: [
              { contactId: contact.id },
              ...(contact.clientId ? [{ clientId: contact.clientId }] : []),
            ],
          },
          orderBy: { lastActivityAt: 'desc' },
          select: { id: true },
        })
      : null;
    const ctx = {
      dealId: deal?.id ?? null,
      clientId: contact?.clientId ?? null,
      contactId: contact?.id ?? null,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.crmMessage.create({
        data: {
          channel: 'WHATSAPP',
          direction: 'INBOUND',
          status: 'RECEIVED',
          userId: owner.userId,
          toAddress: owner.accountLabel,
          fromAddress: from,
          body: text,
          externalId: message.id,
          sentAt,
          metadata: profileName ? { profileName } : undefined,
          ...ctx,
        },
      });
      if (ctx.dealId || ctx.clientId || ctx.contactId) {
        await this.activities.log(
          {
            type: 'WHATSAPP',
            subject: 'WhatsApp recibido',
            body: text.slice(0, 500),
            occurredAt: sentAt,
            ...ctx,
            metadata: { direction: 'INBOUND', from },
          },
          tx,
        );
      }
    });

    const sender = contact
      ? [contact.firstName, contact.lastName].filter(Boolean).join(' ')
      : (profileName ?? `+${from}`);
    await this.notifications.createOne({
      userId: owner.userId,
      description: `Nuevo WhatsApp de ${sender}: ${text.slice(0, 120)}`,
      priority: 'MEDIUM',
      href: deal ? '/dashboard/crm/pipeline' : '/dashboard/crm/contactos',
    });
  }

  private async applyWhatsAppStatus(status: WaStatus) {
    const next = WA_STATUS[status.status];
    if (!next) return;
    const row = await this.prisma.crmMessage.findUnique({
      where: {
        channel_externalId: { channel: 'WHATSAPP', externalId: status.id },
      },
      select: { id: true, status: true },
    });
    if (!row) return;
    if (next !== 'FAILED' && STATUS_RANK[next] <= STATUS_RANK[row.status])
      return;

    const at = status.timestamp
      ? new Date(Number(status.timestamp) * 1000)
      : new Date();
    await this.prisma.crmMessage.update({
      where: { id: row.id },
      data: {
        status: next,
        ...(next === 'DELIVERED' ? { deliveredAt: at } : {}),
        ...(next === 'READ' ? { readAt: at } : {}),
        ...(next === 'FAILED'
          ? {
              error:
                status.errors?.[0]?.message ??
                status.errors?.[0]?.title ??
                'Entrega fallida',
            }
          : {}),
      },
    });
  }

  private async recordOutboundWhatsApp(
    input: {
      to: string;
      body: string;
      fromAddress: string | null;
      externalId: string | null;
      ctx: MessageContext;
      manual: boolean;
      template?: string;
    },
    userId: string,
  ): Promise<CrmMessageItem> {
    const row = await this.prisma.$transaction(async (tx) => {
      const message = await tx.crmMessage.create({
        data: {
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          status: 'SENT',
          userId,
          toAddress: input.to,
          fromAddress: input.fromAddress,
          body: input.body,
          externalId: input.externalId,
          metadata: {
            manual: input.manual,
            ...(input.template ? { template: input.template } : {}),
          },
          ...input.ctx,
        },
        include: MESSAGE_INCLUDE,
      });
      await this.activities.log(
        {
          type: 'WHATSAPP',
          subject: input.manual
            ? 'WhatsApp enviado desde el teléfono'
            : 'WhatsApp enviado',
          body: input.body.slice(0, 500),
          ...input.ctx,
          actorId: userId,
          metadata: {
            messageId: message.id,
            direction: 'OUTBOUND',
            to: input.to,
          },
        },
        tx,
      );
      return message;
    });
    return this.serialize(row);
  }

  private async resolveContext(dto: {
    dealId?: string;
    clientId?: string;
    contactId?: string;
  }): Promise<MessageContext> {
    let clientId = dto.clientId ?? null;
    let contactId = dto.contactId ?? null;
    if (dto.dealId) {
      const deal = await this.prisma.crmDeal.findUnique({
        where: { id: dto.dealId },
        select: { clientId: true, contactId: true },
      });
      if (!deal) throw new BadRequestException('Negocio no encontrado');
      clientId ??= deal.clientId;
      contactId ??= deal.contactId;
    }
    if (contactId && !clientId) {
      const contact = await this.prisma.crmContact.findUnique({
        where: { id: contactId },
        select: { clientId: true },
      });
      clientId = contact?.clientId ?? null;
    }
    return { dealId: dto.dealId ?? null, clientId, contactId };
  }

  private serialize(row: MessageRow): CrmMessageItem {
    return {
      id: row.id,
      channel: row.channel,
      direction: row.direction,
      status: row.status,
      toAddress: row.toAddress,
      fromAddress: row.fromAddress,
      cc: row.cc,
      subject: row.subject,
      body: row.body,
      threadId: row.threadId,
      error: row.error,
      sentAt: row.sentAt.toISOString(),
      deliveredAt: row.deliveredAt?.toISOString() ?? null,
      readAt: row.readAt?.toISOString() ?? null,
      user: row.user,
      deal: row.deal,
      contact: row.contact,
      template: row.template,
    };
  }
}
