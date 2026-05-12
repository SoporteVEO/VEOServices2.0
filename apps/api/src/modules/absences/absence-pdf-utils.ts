// Helpers used by the absence PDF report on the server side.
// Mirrors apps/web/src/lib/format.ts (formatLongDate) and
// apps/web/src/components/pages/absences/absence-utils.ts (computeAbsenceDays).

const SPANISH_LONG_DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Mirrors `formatLongDate` in apps/web/src/lib/format.ts.
 */
export function formatLongDate(
  value: Date | string | null | undefined,
): string {
  if (value == null) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';

  const parts = SPANISH_LONG_DATE_FORMATTER.formatToParts(d);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';

  const out = `${capitalize(weekday)} ${day} de ${capitalize(month)} del ${year}`;
  return out.endsWith('.') ? out : `${out}.`;
}

/**
 * Mirrors `computeAbsenceDays` in
 * apps/web/src/components/pages/absences/absence-utils.ts.
 */
export function computeAbsenceDays(
  fromIso: string | Date,
  toIso: string | Date,
): number {
  const from = typeof fromIso === 'string' ? new Date(fromIso) : fromIso;
  const to = typeof toIso === 'string' ? new Date(toIso) : toIso;
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0;
  const ms = to.getTime() - from.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}
