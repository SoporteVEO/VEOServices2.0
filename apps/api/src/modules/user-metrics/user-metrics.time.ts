import {
  BUSINESS_HOUR_END_EXCLUSIVE,
  BUSINESS_HOUR_START,
  MONTERREY_TZ,
} from './user-metrics.constants.js';

const PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: MONTERREY_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
  hourCycle: 'h23',
});

export interface MonterreyParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
}

export function getMonterreyParts(date: Date): MonterreyParts {
  const parts = PARTS_FORMATTER.formatToParts(date).reduce<
    Record<string, string>
  >((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday ?? '',
  };
}

export function isWithinBusinessHours(date: Date): boolean {
  const { hour } = getMonterreyParts(date);
  return hour >= BUSINESS_HOUR_START && hour < BUSINESS_HOUR_END_EXCLUSIVE;
}

export function toMonterreyDateOnly(date: Date): Date {
  const { year, month, day } = getMonterreyParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export function getMonterreyWeekStart(date: Date): Date {
  const parts = getMonterreyParts(date);
  const offset = WEEKDAY_INDEX[parts.weekday] ?? 0;
  const monday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  monday.setUTCDate(monday.getUTCDate() - offset);
  return monday;
}

export function getMonterreyMonthStart(date: Date): Date {
  const { year, month } = getMonterreyParts(date);
  return new Date(Date.UTC(year, month - 1, 1));
}

export function addDaysUTC(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
