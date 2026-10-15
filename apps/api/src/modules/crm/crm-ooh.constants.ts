export const HOLD_DEFAULT_DAYS = 7;
export const HOLD_MAX_DAYS = 30;
/** Holds expiring within this window are flagged on the dashboard. */
export const HOLD_WARNING_DAYS = 3;
export const RENEWAL_DEFAULT_WINDOW_DAYS = 90;
export const INVENTORY_MAX_RESULTS = 400;
const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Inclusive day count between two calendar dates. */
export function flightDays(start: Date, end: Date): number {
  return Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1,
  );
}

/** Monthly rates are prorated on a 30-day month, as the rate cards are. */
export function siteTotal(rate: number, start: Date, end: Date): number {
  return Math.round(rate * (flightDays(start, end) / 30) * 100) / 100;
}

/** Parses `YYYY-MM-DD` (or a full ISO string) as a UTC calendar date. */
export function calendarDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

export function isoDay(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
