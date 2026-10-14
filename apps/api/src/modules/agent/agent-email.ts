import * as XLSX from 'xlsx';
import { EMAIL_COLORS } from '../email/brand-colors.js';
import type { EmailAttachment } from '../email/email.service.js';
import type { ExcelFileSpec } from './tools/document-schemas.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Blank lines split paragraphs and `- ` lines become a bullet list. */
function bodyToHtml(body: string): string {
  return body
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim());
      if (lines.every((l) => l.startsWith('- '))) {
        const items = lines
          .map(
            (l) => `<li style="margin:0 0 6px;">${escapeHtml(l.slice(2))}</li>`,
          )
          .join('');
        return `<ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.6;">${items}</ul>`;
      }
      return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;">${lines
        .map(escapeHtml)
        .join('<br/>')}</p>`;
    })
    .join('');
}

export function buildAgentEmailHtml(params: {
  subject: string;
  body: string;
  senderName: string;
}): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_COLORS.ice};font-family:Arial,Helvetica,sans-serif;color:${EMAIL_COLORS.dark};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_COLORS.ice};padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:${EMAIL_COLORS.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(27,34,41,0.08);">
            <tr>
              <td style="background:${EMAIL_COLORS.dark};padding:24px 32px;color:${EMAIL_COLORS.white};">
                <p style="margin:0;font-size:12px;letter-spacing:2px;color:${EMAIL_COLORS.mist};">VEO SERVICES</p>
                <h1 style="margin:6px 0 0;font-size:22px;">${escapeHtml(params.subject)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                ${bodyToHtml(params.body)}
              </td>
            </tr>
            <tr>
              <td style="background:${EMAIL_COLORS.snow};padding:14px 32px;border-top:1px solid ${EMAIL_COLORS.mist};">
                <p style="margin:0;font-size:11px;color:${EMAIL_COLORS.steel};text-align:center;">
                  Enviado por ${escapeHtml(params.senderName)} desde VEO Services.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildExcelAttachment(spec: ExcelFileSpec): EmailAttachment {
  const workbook = XLSX.utils.book_new();
  for (const sheet of spec.sheets) {
    const rows = sheet.rows.map((row) =>
      Object.fromEntries(sheet.columns.map((c) => [c.label, row[c.key] ?? ''])),
    );
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: sheet.columns.map((c) => c.label),
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  }) as Buffer;
  return {
    filename: `${spec.fileName.replace(/[\\/:*?"<>|]/g, '-')}.xlsx`,
    content: buffer,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}
