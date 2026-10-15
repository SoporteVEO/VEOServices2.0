import { EMAIL_COLORS } from '../email/brand-colors.js';

export type TemplateVariables = Record<string, string>;

/** Every key `buildTemplateVariables` can fill. */
export const TEMPLATE_VARIABLE_KEYS = [
  'contacto.nombre',
  'contacto.apellido',
  'contacto.nombre_completo',
  'contacto.cargo',
  'contacto.correo',
  'cliente.nombre',
  'cliente.empresa',
  'cliente.correo',
  'negocio.titulo',
  'negocio.valor',
  'negocio.etapa',
  'negocio.cierre',
  'campana.marca',
  'campana.medio',
  'campana.inicio',
  'campana.fin',
  'campana.total_sitios',
  'campana.sitios',
  'asesor.nombre',
  'asesor.nombre_completo',
  'asesor.correo',
  'fecha.hoy',
] as const;

export interface TemplateContext {
  client?: { name: string; company: string | null; email: string } | null;
  contact?: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    jobTitle: string | null;
  } | null;
  deal?: {
    title: string;
    value: number;
    stageName: string;
    expectedCloseDate: Date | null;
    brand?: string | null;
    mediaType?: 'STATIC' | 'DIGITAL' | 'MIXED' | null;
    campaignStart?: Date | null;
    campaignEnd?: Date | null;
    sites?: {
      kind: 'STATIC' | 'DIGITAL';
      code: string;
      label: string;
      cityName: string | null;
      spotsPerDay: number | null;
    }[];
  } | null;
  sender?: { firstName: string; lastName: string | null; email: string } | null;
}

const VARIABLE_RE = /\{\{\s*([a-zA-Z_][\w.]*)\s*\}\}/g;

function money(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function longDate(value: Date): string {
  return new Intl.DateTimeFormat('es-SV', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/El_Salvador',
  }).format(value);
}

const MEDIA_LABELS = {
  STATIC: 'Vallas estáticas',
  DIGITAL: 'Pantallas digitales',
  MIXED: 'Vallas y pantallas digitales',
} as const;

/** `@db.Date` columns are UTC midnights; formatting them in local time would shift the day. */
function calendarLongDate(value: Date): string {
  return new Intl.DateTimeFormat('es-SV', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value);
}

/** Keep the keys in sync with `apps/web/src/components/pages/crm/templates/template-variables.ts`. */
export function buildTemplateVariables(
  ctx: TemplateContext,
): TemplateVariables {
  const vars: TemplateVariables = { 'fecha.hoy': longDate(new Date()) };

  if (ctx.client) {
    vars['cliente.nombre'] = ctx.client.name;
    vars['cliente.empresa'] = ctx.client.company ?? ctx.client.name;
    vars['cliente.correo'] = ctx.client.email;
  }
  if (ctx.contact) {
    vars['contacto.nombre'] = ctx.contact.firstName;
    vars['contacto.apellido'] = ctx.contact.lastName ?? '';
    vars['contacto.nombre_completo'] = [
      ctx.contact.firstName,
      ctx.contact.lastName,
    ]
      .filter(Boolean)
      .join(' ');
    vars['contacto.cargo'] = ctx.contact.jobTitle ?? '';
    vars['contacto.correo'] = ctx.contact.email ?? '';
  }
  if (ctx.deal) {
    vars['negocio.titulo'] = ctx.deal.title;
    vars['negocio.valor'] = money(ctx.deal.value);
    vars['negocio.etapa'] = ctx.deal.stageName;
    vars['negocio.cierre'] = ctx.deal.expectedCloseDate
      ? longDate(ctx.deal.expectedCloseDate)
      : '';
    vars['campana.marca'] = ctx.deal.brand ?? '';
    vars['campana.medio'] = ctx.deal.mediaType
      ? MEDIA_LABELS[ctx.deal.mediaType]
      : '';
    vars['campana.inicio'] = ctx.deal.campaignStart
      ? calendarLongDate(ctx.deal.campaignStart)
      : '';
    vars['campana.fin'] = ctx.deal.campaignEnd
      ? calendarLongDate(ctx.deal.campaignEnd)
      : '';
    const sites = ctx.deal.sites ?? [];
    vars['campana.total_sitios'] = String(sites.length);
    vars['campana.sitios'] = sites
      .map((s) => {
        const place = [s.label, s.cityName].filter(Boolean).join(', ');
        const spots =
          s.kind === 'DIGITAL' && s.spotsPerDay
            ? ` (${s.spotsPerDay} spots/día)`
            : '';
        return `- **${s.code}** · ${place}${spots}`;
      })
      .join('\n');
  }
  if (ctx.sender) {
    vars['asesor.nombre'] = ctx.sender.firstName;
    vars['asesor.nombre_completo'] = [ctx.sender.firstName, ctx.sender.lastName]
      .filter(Boolean)
      .join(' ');
    vars['asesor.correo'] = ctx.sender.email;
  }
  return vars;
}

/** Unknown placeholders render empty so a recipient never sees `{{…}}`. */
export function applyTemplateVariables(
  text: string,
  vars: TemplateVariables,
): string {
  return text.replace(VARIABLE_RE, (_match, name: string) => vars[name] ?? '');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type MarkedModule = typeof import('marked');
let markedModule: Promise<MarkedModule> | null = null;

async function markdownToHtml(markdown: string): Promise<string> {
  markedModule ??= import('marked');
  const { Marked } = await markedModule;
  const parser = new Marked({
    gfm: true,
    breaks: true,
    renderer: {
      html(token) {
        return escapeHtml(token.text);
      },
    },
  });
  return parser.parse(markdown, { async: false });
}

const CONTENT_STYLES = `
  .veo-content { font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: ${EMAIL_COLORS.dark}; }
  .veo-content h1, .veo-content h2, .veo-content h3 { color: ${EMAIL_COLORS.dark}; line-height: 1.25; margin: 20px 0 10px; }
  .veo-content h1 { font-size: 24px; } .veo-content h2 { font-size: 20px; } .veo-content h3 { font-size: 17px; }
  .veo-content p { margin: 0 0 14px; }
  .veo-content a { color: ${EMAIL_COLORS.gray}; }
  .veo-content blockquote { margin: 0 0 14px; padding: 8px 14px; border-left: 3px solid ${EMAIL_COLORS.lime}; background: ${EMAIL_COLORS.ice}; }
  .veo-content code { background: ${EMAIL_COLORS.snow}; padding: 1px 4px; font-family: Consolas, monospace; font-size: 13px; }
  .veo-content table { border-collapse: collapse; margin: 0 0 14px; }
  .veo-content th, .veo-content td { border: 1px solid ${EMAIL_COLORS.mist}; padding: 6px 10px; text-align: left; }
  .veo-content hr { border: 0; border-top: 1px solid ${EMAIL_COLORS.mist}; margin: 20px 0; }
  .veo-content img { max-width: 100%; }
`;

/** Renders the markdown body (plus optional signature) into a branded email. */
export async function renderEmailHtml(
  markdown: string,
  signatureMarkdown?: string | null,
): Promise<string> {
  const body = await markdownToHtml(markdown);
  const signature = signatureMarkdown?.trim()
    ? `<div style="margin-top:24px;padding-top:14px;border-top:1px solid ${EMAIL_COLORS.mist};font-size:13px;color:${EMAIL_COLORS.slate};">${await markdownToHtml(signatureMarkdown)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CONTENT_STYLES}</style></head>
<body style="margin:0;padding:0;background:${EMAIL_COLORS.snow};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_COLORS.snow};padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${EMAIL_COLORS.white};border-top:4px solid ${EMAIL_COLORS.dark};">
<tr><td class="veo-content" style="padding:28px 32px;">${body}${signature}</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}
