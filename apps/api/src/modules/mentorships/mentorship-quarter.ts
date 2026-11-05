/**
 * Mentorships run per calendar quarter in El Salvador time (UTC-6, no DST).
 * Calendar days are represented as `Date`s at UTC midnight, which is also how
 * Prisma returns `@db.Date` columns.
 */
const BUSINESS_UTC_OFFSET_HOURS = -6;
const DAY_MS = 24 * 60 * 60 * 1000;
const QUARTER_KEY_RE = /^(\d{4})-Q([1-4])$/;
const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export type MentorshipStatus = 'DONE' | 'PENDING' | 'OVERDUE';

export interface QuarterInfo {
  key: string;
  label: string;
  start: Date;
  end: Date;
  /** Last day to register the session: end of the quarter's first month. */
  deadline: Date;
}

export function businessToday(now: Date = new Date()): Date {
  const shifted = new Date(
    now.getTime() + BUSINESS_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ),
  );
}

export function addDays(day: Date, days: number): Date {
  return new Date(day.getTime() + days * DAY_MS);
}

export function parseIsoDay(value: string): Date | null {
  if (!ISO_DAY_RE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

export function toIsoDay(day: Date): string {
  return day.toISOString().slice(0, 10);
}

function buildQuarter(year: number, quarter: number): QuarterInfo {
  const firstMonth = (quarter - 1) * 3;
  return {
    key: `${year}-Q${quarter}`,
    label: `T${quarter} ${year}`,
    start: new Date(Date.UTC(year, firstMonth, 1)),
    end: new Date(Date.UTC(year, firstMonth + 3, 0)),
    deadline: new Date(Date.UTC(year, firstMonth + 1, 0)),
  };
}

export function quarterOf(day: Date): QuarterInfo {
  return buildQuarter(
    day.getUTCFullYear(),
    Math.floor(day.getUTCMonth() / 3) + 1,
  );
}

export function parseQuarterKey(key: string): QuarterInfo | null {
  const match = QUARTER_KEY_RE.exec(key);
  if (!match) return null;
  return buildQuarter(Number(match[1]), Number(match[2]));
}

export function previousQuarter(quarter: QuarterInfo): QuarterInfo {
  return quarterOf(addDays(quarter.start, -1));
}

/** Quarters from `from` up to `to`, newest first. */
export function quartersBetween(
  from: QuarterInfo,
  to: QuarterInfo,
): QuarterInfo[] {
  const quarters: QuarterInfo[] = [];
  let cursor = to;
  while (cursor.start.getTime() >= from.start.getTime()) {
    quarters.push(cursor);
    cursor = previousQuarter(cursor);
  }
  return quarters;
}

/** First instant of the quarter in business time, for comparing real timestamps. */
export function quarterStartInstant(quarter: QuarterInfo): Date {
  return new Date(
    quarter.start.getTime() - BUSINESS_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
}

/**
 * Collaborators who join during a quarter are not expected to have a
 * mentorship that quarter. The join day is the Plantilla start date, or the
 * day the record was created when it is missing.
 */
export function joinedBeforeQuarter(
  member: { startDate: Date | null; createdAt: Date },
  quarter: QuarterInfo,
): boolean {
  if (member.startDate) {
    return member.startDate.getTime() < quarter.start.getTime();
  }
  return member.createdAt.getTime() < quarterStartInstant(quarter).getTime();
}

export function mentorshipStatus(
  hasSession: boolean,
  quarter: QuarterInfo,
  today: Date,
): MentorshipStatus {
  if (hasSession) return 'DONE';
  return today.getTime() > quarter.deadline.getTime() ? 'OVERDUE' : 'PENDING';
}

export function serializeQuarter(quarter: QuarterInfo) {
  return {
    key: quarter.key,
    label: quarter.label,
    start: toIsoDay(quarter.start),
    end: toIsoDay(quarter.end),
    deadline: toIsoDay(quarter.deadline),
  };
}
