import { EMAIL_COLORS } from '../email/brand-colors.js';

export interface MentorshipEmail {
  subject: string;
  html: string;
}

interface ShellParams {
  preheader: string;
  heading: string;
  greeting: string;
  paragraphs: string[];
  rows?: { label: string; value: string }[];
  list?: { title: string; items: string[] };
  cta?: { label: string; url: string };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatEmailDay(day: Date): string {
  return day.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function buildShell(params: ShellParams): string {
  const paragraphs = params.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;">${escapeHtml(p)}</p>`,
    )
    .join('');

  const rows = params.rows?.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 16px;background:${EMAIL_COLORS.snow};border:1px solid ${EMAIL_COLORS.mist};">
        ${params.rows
          .map(
            (row) => `<tr>
              <td style="padding:10px 16px;border-bottom:1px solid ${EMAIL_COLORS.mist};font-size:13px;color:${EMAIL_COLORS.slate};width:38%;vertical-align:top;">${escapeHtml(row.label)}</td>
              <td style="padding:10px 16px;border-bottom:1px solid ${EMAIL_COLORS.mist};font-size:13px;color:${EMAIL_COLORS.dark};font-weight:500;white-space:pre-wrap;">${escapeHtml(row.value)}</td>
            </tr>`,
          )
          .join('')}
      </table>`
    : '';

  const list = params.list?.items.length
    ? `<h2 style="margin:16px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:${EMAIL_COLORS.gray};">${escapeHtml(params.list.title)}</h2>
       <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.7;">
         ${params.list.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
       </ul>`
    : '';

  const cta = params.cta
    ? `<p style="margin:20px 0 4px;">
         <a href="${escapeHtml(params.cta.url)}" style="display:inline-block;background:${EMAIL_COLORS.lime};color:${EMAIL_COLORS.dark};padding:12px 20px;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(params.cta.label)}</a>
       </p>`
    : '';

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_COLORS.ice};font-family:Arial,Helvetica,sans-serif;color:${EMAIL_COLORS.dark};">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">${escapeHtml(params.preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_COLORS.ice};padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:${EMAIL_COLORS.white};overflow:hidden;">
            <tr>
              <td style="background:${EMAIL_COLORS.dark};padding:24px 32px;color:${EMAIL_COLORS.white};">
                <p style="margin:0;font-size:12px;letter-spacing:2px;color:${EMAIL_COLORS.mist};">VEO SERVICES — TALENTO HUMANO</p>
                <h1 style="margin:6px 0 0;font-size:22px;">${escapeHtml(params.heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${escapeHtml(params.greeting)}</p>
                ${paragraphs}
                ${rows}
                ${list}
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px 32px;">
                <p style="margin:24px 0 0;font-size:13px;color:${EMAIL_COLORS.slate};line-height:1.6;">
                  Saludos,<br/>
                  <strong>VEO Services — Talento Humano</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:${EMAIL_COLORS.snow};padding:14px 32px;border-top:1px solid ${EMAIL_COLORS.mist};">
                <p style="margin:0;font-size:11px;color:${EMAIL_COLORS.steel};text-align:center;">
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

function pendingCountText(count: number): string {
  return count === 1
    ? '1 colaborador con mentoría pendiente'
    : `${count} colaboradores con mentoría pendiente`;
}

export function buildQuarterStartEmail(params: {
  bossName: string;
  quarterLabel: string;
  deadline: Date;
  collaborators: string[];
  url: string;
}): MentorshipEmail {
  const deadline = formatEmailDay(params.deadline);
  const count = pendingCountText(params.collaborators.length);
  return {
    subject: `Mentorías ${params.quarterLabel}: tienes ${count}`,
    html: buildShell({
      preheader: `Fecha límite: ${deadline}`,
      heading: `Mentorías Keep / Stop / Start · ${params.quarterLabel}`,
      greeting: `Hola ${params.bossName},`,
      paragraphs: [
        `Inició un nuevo trimestre. Tienes ${count}; la fecha límite para registrarlas es el ${deadline}.`,
        'Antes de cada sesión revisa el Start acordado en la mentoría anterior para evaluar si se cumplió.',
      ],
      list: { title: 'Personal a cargo', items: params.collaborators },
      cta: { label: 'Abrir Mentorías', url: params.url },
    }),
  };
}

export function buildBossOverdueEmail(params: {
  bossName: string;
  quarterLabel: string;
  deadline: Date;
  collaborators: string[];
  url: string;
}): MentorshipEmail {
  const deadline = formatEmailDay(params.deadline);
  const count = params.collaborators.length;
  return {
    subject: `Mentorías vencidas ${params.quarterLabel}: ${count} sin registrar`,
    html: buildShell({
      preheader: `La fecha límite fue el ${deadline}`,
      heading: 'Tienes mentorías vencidas',
      greeting: `Hola ${params.bossName},`,
      paragraphs: [
        `La fecha límite del ${params.quarterLabel} fue el ${deadline} y ${count === 1 ? 'la siguiente mentoría sigue' : 'las siguientes mentorías siguen'} sin registrarse. Talento Humano ya fue notificado.`,
      ],
      list: { title: 'Mentorías vencidas', items: params.collaborators },
      cta: { label: 'Registrar mentorías', url: params.url },
    }),
  };
}

export function buildHrOverdueEmail(params: {
  quarterLabel: string;
  deadline: Date;
  byDepartment: { name: string; overdue: number; total: number }[];
  url: string;
}): MentorshipEmail {
  const total = params.byDepartment.reduce((sum, d) => sum + d.overdue, 0);
  return {
    subject: `Mentorías vencidas ${params.quarterLabel}: ${total} en total`,
    html: buildShell({
      preheader: `${total} mentorías no se registraron a tiempo`,
      heading: 'Resumen de mentorías vencidas',
      greeting: 'Estimado equipo de Talento Humano,',
      paragraphs: [
        `Al cierre de la fecha límite del ${params.quarterLabel} (${formatEmailDay(params.deadline)}) quedaron ${total} mentorías sin registrar.`,
      ],
      rows: params.byDepartment.map((d) => ({
        label: d.name,
        value: `${d.overdue} de ${d.total} vencidas`,
      })),
      cta: { label: 'Abrir panel de mentorías', url: params.url },
    }),
  };
}

export function buildSessionRegisteredEmail(params: {
  collaboratorName: string;
  mentorName: string;
  sessionNumber: number;
  startWhat: string;
  commitment: string;
  nextFollowUpDate: Date;
  url: string;
}): MentorshipEmail {
  return {
    subject: `Tu mentoría N.º ${params.sessionNumber} fue registrada`,
    html: buildShell({
      preheader: 'Revisa tus acuerdos y confirma de recibido',
      heading: 'Revisa los acuerdos de tu mentoría',
      greeting: `Hola ${params.collaboratorName},`,
      paragraphs: [
        `${params.mentorName} registró tu mentoría Keep / Stop / Start. Revisa los acuerdos y confirma de recibido en VEO Services; también puedes dejar un comentario.`,
      ],
      rows: [
        { label: 'Start acordado', value: params.startWhat },
        { label: 'Compromiso', value: params.commitment },
        {
          label: 'Próximo seguimiento',
          value: formatEmailDay(params.nextFollowUpDate),
        },
      ],
      cta: { label: 'Ver y confirmar', url: params.url },
    }),
  };
}

export function buildFollowUpEmail(params: {
  recipientName: string;
  collaboratorName: string;
  isCollaborator: boolean;
  startWhat: string;
  commitment: string;
  followUpDate: Date;
  url: string;
}): MentorshipEmail {
  const date = formatEmailDay(params.followUpDate);
  return {
    subject: `Seguimiento de mentoría el ${date}`,
    html: buildShell({
      preheader: `Seguimiento programado para el ${date}`,
      heading: 'Se acerca el seguimiento de la mentoría',
      greeting: `Hola ${params.recipientName},`,
      paragraphs: [
        params.isCollaborator
          ? `El ${date} es el seguimiento de los acuerdos de tu mentoría.`
          : `El ${date} es el seguimiento de los acuerdos de la mentoría de ${params.collaboratorName}.`,
      ],
      rows: [
        { label: 'Start acordado', value: params.startWhat },
        { label: 'Compromiso', value: params.commitment },
      ],
      cta: { label: 'Ver mentoría', url: params.url },
    }),
  };
}
