import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { CrmConnectionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { signatureFromMetadata } from './crm-templates.service.js';
import type { CrmAuthUser } from './crm.constants.js';
import type { ConnectWhatsAppDto } from './dto/crm-connection.dto.js';
import { GmailClient } from './integrations/gmail.client.js';
import {
  createOAuthState,
  decryptToken,
  encryptToken,
  verifyOAuthState,
} from './integrations/token-cipher.js';
import {
  WhatsAppClient,
  type WhatsAppTemplate,
} from './integrations/whatsapp.client.js';

export interface CrmConnectionsStatus {
  gmail: {
    configured: boolean;
    allowedDomain: string;
    connected: boolean;
    status: CrmConnectionStatus | null;
    email: string | null;
    signature: string | null;
    lastError: string | null;
    connectedAt: string | null;
  };
  whatsapp: {
    connected: boolean;
    status: CrmConnectionStatus | null;
    displayPhoneNumber: string | null;
    verifiedName: string | null;
    phoneNumberId: string | null;
    businessAccountId: string | null;
    webhookConfigured: boolean;
    lastError: string | null;
    connectedAt: string | null;
  };
}

export interface GmailAccess {
  accessToken: string;
  email: string;
  displayName: string;
  signature: string | null;
}

export interface WhatsAppAccess {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string | null;
  displayPhoneNumber: string;
}

const REFRESH_MARGIN_MS = 60 * 1000;

function metadataObject(
  value: Prisma.JsonValue | null | undefined,
): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function webAppUrl(): string {
  const fallback = (
    process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000'
  ).split(',')[0];
  return (process.env.WEB_APP_URL ?? fallback).replace(/\/$/, '');
}

@Injectable()
export class CrmConnectionsService {
  private readonly logger = new Logger(CrmConnectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmail: GmailClient,
    private readonly whatsapp: WhatsAppClient,
  ) {}

  async status(userId: string): Promise<CrmConnectionsStatus> {
    const rows = await this.prisma.crmChannelConnection.findMany({
      where: { userId },
    });
    const gmail = rows.find((r) => r.provider === 'GMAIL');
    const wa = rows.find((r) => r.provider === 'WHATSAPP');
    const waMeta = metadataObject(wa?.metadata);

    return {
      gmail: {
        configured: this.gmail.isConfigured(),
        allowedDomain: this.gmail.allowedDomain,
        connected: Boolean(gmail),
        status: gmail?.status ?? null,
        email: gmail?.accountLabel ?? null,
        signature: signatureFromMetadata(gmail?.metadata),
        lastError: gmail?.lastError ?? null,
        connectedAt: gmail?.createdAt.toISOString() ?? null,
      },
      whatsapp: {
        connected: Boolean(wa),
        status: wa?.status ?? null,
        displayPhoneNumber: wa?.accountLabel ?? null,
        verifiedName: (waMeta.verifiedName as string | undefined) ?? null,
        phoneNumberId: wa?.externalAccountId ?? null,
        businessAccountId:
          (waMeta.businessAccountId as string | undefined) ?? null,
        webhookConfigured: Boolean(
          process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
          process.env.WHATSAPP_APP_SECRET,
        ),
        lastError: wa?.lastError ?? null,
        connectedAt: wa?.createdAt.toISOString() ?? null,
      },
    };
  }

  gmailAuthUrl(user: CrmAuthUser): { url: string } {
    return {
      url: this.gmail.buildAuthUrl(createOAuthState(user.id), user.email),
    };
  }

  /** Completes the OAuth round trip and returns where to send the browser. */
  async handleGmailCallback(params: {
    code?: string;
    state?: string;
    error?: string;
  }): Promise<string> {
    const target = `${webAppUrl()}/dashboard/crm/ajustes`;
    const fail = (reason: string) =>
      `${target}?gmail=error&reason=${encodeURIComponent(reason)}`;

    if (params.error)
      return fail(
        params.error === 'access_denied' ? 'Permiso denegado' : params.error,
      );
    const userId = params.state ? verifyOAuthState(params.state) : null;
    if (!userId || !params.code)
      return fail('La sesión de autorización expiró. Intenta de nuevo.');

    try {
      const tokens = await this.gmail.exchangeCode(params.code);
      const profile = await this.gmail.getProfile(tokens.accessToken);
      const domain = this.gmail.allowedDomain;
      if (!profile.email.endsWith(`@${domain}`)) {
        await this.gmail.revoke(tokens.accessToken);
        return fail(`Solo se permiten cuentas @${domain}`);
      }

      const existing = await this.prisma.crmChannelConnection.findUnique({
        where: { userId_provider: { userId, provider: 'GMAIL' } },
      });
      const refreshToken = tokens.refreshToken
        ? encryptToken(tokens.refreshToken)
        : (existing?.refreshToken ?? null);
      if (!refreshToken) {
        return fail(
          'Google no entregó un token de actualización. Revoca el acceso y vuelve a conectar.',
        );
      }

      const metadata = {
        ...metadataObject(existing?.metadata),
        displayName: profile.name,
      } as Prisma.InputJsonValue;
      const data = {
        status: 'ACTIVE' as const,
        accountLabel: profile.email,
        accessToken: encryptToken(tokens.accessToken),
        refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        scope: tokens.scope,
        lastError: null,
        metadata,
      };
      await this.prisma.crmChannelConnection.upsert({
        where: { userId_provider: { userId, provider: 'GMAIL' } },
        create: { userId, provider: 'GMAIL', ...data },
        update: data,
      });
      return `${target}?gmail=connected`;
    } catch (error) {
      this.logger.error(`Gmail OAuth falló: ${String(error)}`);
      return fail(
        error instanceof Error ? error.message : 'No se pudo conectar Gmail',
      );
    }
  }

  async disconnectGmail(userId: string): Promise<{ disconnected: true }> {
    const row = await this.prisma.crmChannelConnection.findUnique({
      where: { userId_provider: { userId, provider: 'GMAIL' } },
    });
    if (!row) throw new NotFoundException('Gmail no está conectado');
    if (row.refreshToken) {
      try {
        await this.gmail.revoke(decryptToken(row.refreshToken));
      } catch {
        // The connection is removed even if Google no longer recognises the token.
      }
    }
    await this.prisma.crmChannelConnection.delete({ where: { id: row.id } });
    return { disconnected: true };
  }

  async updateSignature(
    userId: string,
    signature: string,
  ): Promise<CrmConnectionsStatus> {
    const row = await this.prisma.crmChannelConnection.findUnique({
      where: { userId_provider: { userId, provider: 'GMAIL' } },
    });
    if (!row)
      throw new BadRequestException(
        'Conecta tu Gmail antes de configurar la firma',
      );
    await this.prisma.crmChannelConnection.update({
      where: { id: row.id },
      data: {
        metadata: {
          ...metadataObject(row.metadata),
          signature,
        } as Prisma.InputJsonValue,
      },
    });
    return this.status(userId);
  }

  async getGmailAccess(userId: string): Promise<GmailAccess> {
    const row = await this.prisma.crmChannelConnection.findUnique({
      where: { userId_provider: { userId, provider: 'GMAIL' } },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!row) {
      throw new BadRequestException(
        'Conecta tu cuenta de Gmail en CRM › Ajustes para enviar correos',
      );
    }

    let accessToken = decryptToken(row.accessToken);
    const expired =
      !row.tokenExpiresAt ||
      row.tokenExpiresAt.getTime() - REFRESH_MARGIN_MS < Date.now();
    if (expired) {
      if (!row.refreshToken) {
        throw new BadRequestException(
          'Tu conexión con Gmail expiró. Vuelve a conectarla.',
        );
      }
      try {
        const tokens = await this.gmail.refresh(decryptToken(row.refreshToken));
        accessToken = tokens.accessToken;
        await this.prisma.crmChannelConnection.update({
          where: { id: row.id },
          data: {
            accessToken: encryptToken(tokens.accessToken),
            refreshToken: tokens.refreshToken
              ? encryptToken(tokens.refreshToken)
              : row.refreshToken,
            tokenExpiresAt: tokens.expiresAt,
            status: 'ACTIVE',
            lastError: null,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this.markError(row.id, message);
        throw new BadRequestException(
          'Tu conexión con Gmail expiró. Vuelve a conectarla en Ajustes.',
        );
      }
    }

    return {
      accessToken,
      email: row.accountLabel,
      displayName: [row.user.firstName, row.user.lastName]
        .filter(Boolean)
        .join(' '),
      signature: signatureFromMetadata(row.metadata),
    };
  }

  async connectWhatsApp(
    userId: string,
    dto: ConnectWhatsAppDto,
  ): Promise<CrmConnectionsStatus> {
    const taken = await this.prisma.crmChannelConnection.findFirst({
      where: {
        provider: 'WHATSAPP',
        externalAccountId: dto.phoneNumberId,
        userId: { not: userId },
      },
      select: { id: true },
    });
    if (taken) {
      throw new ConflictException(
        'Ese número de WhatsApp ya está conectado por otro usuario',
      );
    }

    const info = await this.whatsapp.getPhoneInfo(
      dto.phoneNumberId,
      dto.accessToken,
    );
    if (dto.businessAccountId) {
      await this.whatsapp.listTemplates(dto.businessAccountId, dto.accessToken);
    }

    const data = {
      status: 'ACTIVE' as const,
      accountLabel: info.displayPhoneNumber,
      accessToken: encryptToken(dto.accessToken),
      externalAccountId: dto.phoneNumberId,
      lastError: null,
      metadata: {
        verifiedName: info.verifiedName,
        businessAccountId: dto.businessAccountId ?? null,
      },
    };
    await this.prisma.crmChannelConnection.upsert({
      where: { userId_provider: { userId, provider: 'WHATSAPP' } },
      create: { userId, provider: 'WHATSAPP', ...data },
      update: data,
    });
    return this.status(userId);
  }

  async disconnectWhatsApp(userId: string): Promise<{ disconnected: true }> {
    const deleted = await this.prisma.crmChannelConnection.deleteMany({
      where: { userId, provider: 'WHATSAPP' },
    });
    if (deleted.count === 0)
      throw new NotFoundException('WhatsApp no está conectado');
    return { disconnected: true };
  }

  async getWhatsAppAccess(userId: string): Promise<WhatsAppAccess | null> {
    const row = await this.prisma.crmChannelConnection.findUnique({
      where: { userId_provider: { userId, provider: 'WHATSAPP' } },
    });
    if (!row?.externalAccountId) return null;
    const meta = metadataObject(row.metadata);
    return {
      phoneNumberId: row.externalAccountId,
      accessToken: decryptToken(row.accessToken),
      businessAccountId:
        (meta.businessAccountId as string | null | undefined) ?? null,
      displayPhoneNumber: row.accountLabel,
    };
  }

  async whatsappTemplates(userId: string): Promise<WhatsAppTemplate[]> {
    const access = await this.getWhatsAppAccess(userId);
    if (!access?.businessAccountId) return [];
    return this.whatsapp.listTemplates(
      access.businessAccountId,
      access.accessToken,
    );
  }

  async findWhatsAppOwner(phoneNumberId: string) {
    return this.prisma.crmChannelConnection.findFirst({
      where: { provider: 'WHATSAPP', externalAccountId: phoneNumberId },
      select: { userId: true, accountLabel: true },
    });
  }

  async markError(connectionId: string, message: string): Promise<void> {
    await this.prisma.crmChannelConnection.update({
      where: { id: connectionId },
      data: { status: 'ERROR', lastError: message.slice(0, 500) },
    });
  }
}
