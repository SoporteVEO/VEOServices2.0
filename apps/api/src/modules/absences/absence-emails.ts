export interface AbsenceEmailData {
  id: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string | null;
    email: string;
  };
  imagesCount: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function getFullName(user: AbsenceEmailData['user']): string {
  const parts = [user.firstName, user.lastName].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(' ') : 'Sin nombre';
}

function diffDaysInclusive(from: Date, to: Date): number {
  const start = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function buildShell(params: {
  preheader: string;
  heading: string;
  introHtml: string;
  detailsRows: { label: string; value: string }[];
  reason: string;
  attachmentNote?: string;
}): string {
  const detailsTable = params.detailsRows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;width:38%;vertical-align:top;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;font-weight:500;">
            ${escapeHtml(row.value)}
          </td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">${escapeHtml(params.preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:#003366;padding:24px 32px;color:#ffffff;">
                <p style="margin:0;font-size:12px;letter-spacing:2px;color:#7aa3c8;">VEO SERVICES — RECURSOS HUMANOS</p>
                <h1 style="margin:6px 0 0;font-size:22px;">${escapeHtml(params.heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                ${params.introHtml}
                <h2 style="margin:24px 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1.5px;color:#003366;">
                  Detalles de la solicitud
                </h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
                  ${detailsTable}
                </table>
                <h2 style="margin:24px 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1.5px;color:#003366;">
                  Motivo
                </h2>
                <div style="padding:14px 16px;background:#fef9c3;border-left:4px solid #eab308;border-radius:6px;font-size:14px;line-height:1.6;color:#1f2937;white-space:pre-wrap;">
                  ${escapeHtml(params.reason)}
                </div>
                ${
                  params.attachmentNote
                    ? `<p style="margin:18px 0 0;font-size:13px;color:#4b5563;line-height:1.5;">
                        ${escapeHtml(params.attachmentNote)}
                      </p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px 32px;">
                <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                  Saludos,<br/>
                  <strong>VEO Services — Recursos Humanos</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                  Este es un correo automático del sistema. Por favor no respondas directamente.
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

function buildDetailsRows(absence: AbsenceEmailData): {
  label: string;
  value: string;
}[] {
  const days = diffDaysInclusive(absence.fromDate, absence.toDate);
  return [
    { label: 'Empleado', value: getFullName(absence.user) },
    { label: 'Correo', value: absence.user.email },
    { label: 'Fecha de inicio', value: formatLongDate(absence.fromDate) },
    { label: 'Fecha de fin', value: formatLongDate(absence.toDate) },
    {
      label: 'Días totales',
      value: `${days} ${days === 1 ? 'día' : 'días'}`,
    },
    { label: 'Solicitud creada', value: formatLongDate(absence.createdAt) },
    {
      label: 'Documentos adjuntos',
      value: `${absence.imagesCount} ${absence.imagesCount === 1 ? 'documento' : 'documentos'}`,
    },
    { label: 'ID de solicitud', value: absence.id.slice(0, 8).toUpperCase() },
  ];
}

export function buildHrAbsenceEmail(absence: AbsenceEmailData): {
  subject: string;
  html: string;
} {
  const fullName = getFullName(absence.user);
  const subject = `Nueva solicitud de incapacidad - ${fullName}`;
  const html = buildShell({
    preheader: `Nueva solicitud de incapacidad de ${fullName}`,
    heading: 'Nueva solicitud de incapacidad',
    introHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Estimado equipo de Recursos Humanos,
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
        El usuario <strong>${escapeHtml(fullName)}</strong> ha enviado una nueva solicitud de incapacidad. A continuación, los detalles de la solicitud y el reporte completo en formato PDF está adjunto a este correo.
      </p>`,
    detailsRows: buildDetailsRows(absence),
    reason: absence.reason,
    attachmentNote: `Encontrarás el reporte completo en formato PDF adjunto a este correo${absence.imagesCount > 0 ? ', incluyendo la información de los documentos adjuntos cargados por el empleado' : ''}.`,
  });
  return { subject, html };
}

export function buildEmployeeAbsenceConfirmationEmail(
  absence: AbsenceEmailData,
): { subject: string; html: string } {
  const fullName = getFullName(absence.user);
  const subject = 'Tu solicitud de incapacidad fue enviada';
  const html = buildShell({
    preheader: 'Tu solicitud de incapacidad fue enviada',
    heading: 'Solicitud enviada con éxito',
    introHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Hola ${escapeHtml(fullName)},
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
        Hemos recibido tu solicitud de incapacidad y ha sido enviada al equipo de Recursos Humanos para su revisión. Te notificaremos cuando el estado de tu solicitud cambie.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4b5563;">
        Adjunto encontrarás un reporte en PDF con la información de tu solicitud para tu registro.
      </p>`,
    detailsRows: buildDetailsRows(absence),
    reason: absence.reason,
    attachmentNote:
      'Si necesitas hacer cambios o tienes alguna duda, ponte en contacto con el equipo de Recursos Humanos.',
  });
  return { subject, html };
}
