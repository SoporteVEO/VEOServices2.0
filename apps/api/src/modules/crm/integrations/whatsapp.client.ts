import { BadRequestException, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

function graphUrl(path: string): string {
  const version = process.env.WHATSAPP_GRAPH_VERSION ?? 'v23.0';
  return `https://graph.facebook.com/${version}/${path}`;
}

export interface WhatsAppPhoneInfo {
  displayPhoneNumber: string;
  verifiedName: string | null;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: string | null;
  bodyText: string | null;
  parameterCount: number;
}

export interface WhatsAppTemplatePayload {
  name: string;
  language: string;
  parameters: string[];
}

@Injectable()
export class WhatsAppClient {
  get webhookVerifyToken(): string | null {
    return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? null;
  }

  /** Validates Meta's `X-Hub-Signature-256` against the raw request body. */
  isValidSignature(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret || !rawBody || !signature?.startsWith('sha256='))
      return false;
    const expected = Buffer.from(
      `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`,
    );
    const received = Buffer.from(signature);
    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }

  async getPhoneInfo(
    phoneNumberId: string,
    accessToken: string,
  ): Promise<WhatsAppPhoneInfo> {
    const data = await this.request<{
      display_phone_number?: string;
      verified_name?: string;
    }>(
      `${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`,
      accessToken,
    );
    if (!data.display_phone_number) {
      throw new BadRequestException(
        'Meta no devolvió el número de WhatsApp. Revisa el Phone Number ID.',
      );
    }
    return {
      displayPhoneNumber: data.display_phone_number,
      verifiedName: data.verified_name ?? null,
    };
  }

  async listTemplates(
    businessAccountId: string,
    accessToken: string,
  ): Promise<WhatsAppTemplate[]> {
    const data = await this.request<{
      data?: {
        name: string;
        language: string;
        status: string;
        category?: string;
        components?: { type: string; text?: string }[];
      }[];
    }>(
      `${encodeURIComponent(businessAccountId)}/message_templates?fields=name,language,status,category,components&limit=200`,
      accessToken,
    );
    return (data.data ?? [])
      .filter((t) => t.status === 'APPROVED')
      .map((t) => {
        const bodyText =
          t.components?.find((c) => c.type === 'BODY')?.text ?? null;
        const parameterCount = new Set(bodyText?.match(/\{\{\d+\}\}/g) ?? [])
          .size;
        return {
          name: t.name,
          language: t.language,
          category: t.category ?? null,
          bodyText,
          parameterCount,
        };
      });
  }

  async sendText(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    body: string,
  ): Promise<string> {
    return this.sendMessage(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body, preview_url: true },
    });
  }

  async sendTemplate(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    template: WhatsAppTemplatePayload,
  ): Promise<string> {
    return this.sendMessage(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language },
        ...(template.parameters.length
          ? {
              components: [
                {
                  type: 'body',
                  parameters: template.parameters.map((text) => ({
                    type: 'text',
                    text,
                  })),
                },
              ],
            }
          : {}),
      },
    });
  }

  private async sendMessage(
    phoneNumberId: string,
    accessToken: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const data = await this.request<{ messages?: { id: string }[] }>(
      `${encodeURIComponent(phoneNumberId)}/messages`,
      accessToken,
      { method: 'POST', body: JSON.stringify(payload) },
    );
    const id = data.messages?.[0]?.id;
    if (!id) throw new BadRequestException('WhatsApp no confirmó el envío');
    return id;
  }

  private async request<T>(
    path: string,
    accessToken: string,
    init?: { method?: string; body?: string },
  ): Promise<T> {
    const res = await fetch(graphUrl(path), {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: init?.body,
    });
    const data = (await res.json().catch(() => ({}))) as T & {
      error?: { message?: string; error_user_msg?: string };
    };
    if (!res.ok) {
      const reason =
        data.error?.error_user_msg ?? data.error?.message ?? res.statusText;
      throw new BadRequestException(`WhatsApp: ${reason}`);
    }
    return data;
  }
}
