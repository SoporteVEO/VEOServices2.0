import { BadRequestException, Injectable, Logger } from '@nestjs/common';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export const GMAIL_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
];

export interface GmailTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string | null;
}

export interface GmailThreadMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  cc: string | null;
  subject: string | null;
  messageIdHeader: string | null;
  date: Date;
  text: string;
  html: string | null;
}

export interface MimeInput {
  fromEmail: string;
  fromName: string;
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  html: string;
  inReplyTo?: string | null;
}

interface GmailPayloadPart {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string; size?: number };
  parts?: GmailPayloadPart[];
}

interface GmailApiMessage {
  id: string;
  threadId: string;
  internalDate?: string;
  payload?: GmailPayloadPart;
}

function encodeHeader(value: string): string {
  return /^[\x20-\x7E]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function chunk76(base64: string): string {
  return base64.replace(/.{1,76}/g, '$&\r\n').trimEnd();
}

function decodeBase64Url(data: string | undefined): string {
  if (!data) return '';
  return Buffer.from(data, 'base64url').toString('utf8');
}

function header(
  part: GmailPayloadPart | undefined,
  name: string,
): string | null {
  const found = part?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase(),
  );
  return found?.value ?? null;
}

function findPart(
  part: GmailPayloadPart | undefined,
  mimeType: string,
): GmailPayloadPart | null {
  if (!part) return null;
  if (part.mimeType === mimeType && part.body?.data) return part;
  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found) return found;
  }
  return null;
}

/** Drops the quoted history Gmail appends under "El … escribió:". */
function stripQuotedReply(text: string): string {
  const lines = text.split(/\r?\n/);
  const cut = lines.findIndex(
    (line) =>
      /^On .+wrote:$/.test(line.trim()) ||
      /^El .+escribió:$/.test(line.trim()) ||
      line.startsWith('>'),
  );
  return (cut > 0 ? lines.slice(0, cut) : lines).join('\n').trim();
}

@Injectable()
export class GmailClient {
  private readonly logger = new Logger(GmailClient.name);

  get allowedDomain(): string {
    return (
      process.env.CRM_GOOGLE_ALLOWED_DOMAIN ?? 'veo.com.sv'
    ).toLowerCase();
  }

  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REDIRECT_URI,
    );
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'La integración con Gmail no está configurada en el servidor',
      );
    }
  }

  buildAuthUrl(state: string, loginHint?: string): string {
    this.assertConfigured();
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
      response_type: 'code',
      scope: GMAIL_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      hd: this.allowedDomain,
      state,
    });
    if (loginHint) params.set('login_hint', loginHint);
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<GmailTokens> {
    this.assertConfigured();
    const body = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
      grant_type: 'authorization_code',
    });
    const data = await this.postForm(TOKEN_URL, body);
    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string | undefined) ?? null,
      expiresAt: new Date(Date.now() + Number(data.expires_in ?? 3600) * 1000),
      scope: (data.scope as string | undefined) ?? null,
    };
  }

  async refresh(refreshToken: string): Promise<GmailTokens> {
    this.assertConfigured();
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    });
    const data = await this.postForm(TOKEN_URL, body);
    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string | undefined) ?? refreshToken,
      expiresAt: new Date(Date.now() + Number(data.expires_in ?? 3600) * 1000),
      scope: (data.scope as string | undefined) ?? null,
    };
  }

  async revoke(token: string): Promise<void> {
    try {
      await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo revocar el token de Gmail: ${String(error)}`,
      );
    }
  }

  async getProfile(
    accessToken: string,
  ): Promise<{ email: string; name: string | null; hd: string | null }> {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new BadRequestException('No se pudo leer el perfil de Google');
    }
    const data = (await res.json()) as {
      email?: string;
      name?: string;
      hd?: string;
    };
    if (!data.email) {
      throw new BadRequestException('Google no devolvió un correo');
    }
    return {
      email: data.email.toLowerCase(),
      name: data.name ?? null,
      hd: data.hd ?? null,
    };
  }

  buildMime(input: MimeInput): string {
    const boundary = `veo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    const headers = [
      `From: ${encodeHeader(input.fromName)} <${input.fromEmail}>`,
      `To: ${input.to.join(', ')}`,
      ...(input.cc?.length ? [`Cc: ${input.cc.join(', ')}`] : []),
      `Subject: ${encodeHeader(input.subject)}`,
      ...(input.inReplyTo
        ? [`In-Reply-To: ${input.inReplyTo}`, `References: ${input.inReplyTo}`]
        : []),
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];
    const part = (type: string, content: string) =>
      [
        `--${boundary}`,
        `Content-Type: ${type}; charset="UTF-8"`,
        'Content-Transfer-Encoding: base64',
        '',
        chunk76(Buffer.from(content, 'utf8').toString('base64')),
      ].join('\r\n');

    return [
      headers.join('\r\n'),
      '',
      part('text/plain', input.text),
      part('text/html', input.html),
      `--${boundary}--`,
      '',
    ].join('\r\n');
  }

  async send(
    accessToken: string,
    mime: string,
    threadId?: string | null,
  ): Promise<{ id: string; threadId: string }> {
    const res = await fetch(`${GMAIL_API}/messages/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: Buffer.from(mime, 'utf8').toString('base64url'),
        ...(threadId ? { threadId } : {}),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      threadId?: string;
      error?: { message?: string };
    };
    if (!res.ok || !data.id || !data.threadId) {
      throw new BadRequestException(
        `Gmail rechazó el envío: ${data.error?.message ?? res.statusText}`,
      );
    }
    return { id: data.id, threadId: data.threadId };
  }

  async getThread(
    accessToken: string,
    threadId: string,
  ): Promise<GmailThreadMessage[]> {
    const res = await fetch(
      `${GMAIL_API}/threads/${encodeURIComponent(threadId)}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.status === 404) return [];
    if (!res.ok) {
      throw new BadRequestException(
        `No se pudo leer la conversación de Gmail (${res.status})`,
      );
    }
    const data = (await res.json()) as { messages?: GmailApiMessage[] };
    return (data.messages ?? []).map((message) => {
      const payload = message.payload;
      const textPart = findPart(payload, 'text/plain');
      const htmlPart = findPart(payload, 'text/html');
      const rawText = textPart
        ? decodeBase64Url(textPart.body?.data)
        : decodeBase64Url(payload?.body?.data);
      const html = htmlPart ? decodeBase64Url(htmlPart.body?.data) : null;
      return {
        id: message.id,
        threadId: message.threadId,
        from: header(payload, 'From') ?? '',
        to: header(payload, 'To') ?? '',
        cc: header(payload, 'Cc'),
        subject: header(payload, 'Subject'),
        messageIdHeader:
          header(payload, 'Message-ID') ?? header(payload, 'Message-Id'),
        date: message.internalDate
          ? new Date(Number(message.internalDate))
          : new Date(),
        text: stripQuotedReply(rawText),
        html,
      };
    });
  }

  private async postForm(
    url: string,
    body: URLSearchParams,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      const reason =
        (data.error_description as string | undefined) ??
        (data.error as string | undefined) ??
        res.statusText;
      throw new BadRequestException(`Google rechazó la solicitud: ${reason}`);
    }
    return data;
  }
}
