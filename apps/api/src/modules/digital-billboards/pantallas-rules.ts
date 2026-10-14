export const ALERT_DAYS = 7;
export const FULL_SUBLIST_SPOTS = 900;
export const HALF_SUBLIST_SPOTS = 450;
export const MAX_OPERATING_HOURS = 23;
export const DEFAULT_SPOTS_PER_HOUR = 450;
export const DEFAULT_MIN_HOURS = 16.5;

const BUSINESS_TIME_ZONE = 'America/El_Salvador';
const DAY_MS = 86_400_000;

export type CampaignStatus =
  | 'ACTIVE'
  | 'EXPIRING'
  | 'FINISHED'
  | 'SCHEDULED'
  | 'UNDATED'
  | 'PAUSED';

export interface CampaignDates {
  startDate: string | null;
  endDate: string | null;
  paused: boolean;
}

export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date());
}

/** Calendar day of an instant in the business time zone. */
export function localIsoDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
  }).format(date);
}

export function toIsoDate(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export function fromIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = fromIsoDate(fromIso);
  const b = fromIsoDate(toIso);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export function campaignStatus(
  campaign: CampaignDates,
  refIso: string,
): CampaignStatus {
  const { startDate, endDate } = campaign;
  if (endDate && refIso > endDate) return 'FINISHED';
  if (campaign.paused) return 'PAUSED';
  if (!startDate && !endDate) return 'UNDATED';
  if (startDate && refIso < startDate) return 'SCHEDULED';
  if (endDate && daysBetween(refIso, endDate) <= ALERT_DAYS) return 'EXPIRING';
  return 'ACTIVE';
}

export function occupiesAir(status: CampaignStatus): boolean {
  return status === 'ACTIVE' || status === 'EXPIRING';
}

export function minutesOf(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Operating hours; a turn-off earlier than the turn-on crosses midnight. */
export function operatingHours(turnOnAt: string, turnOffAt: string): number {
  const on = minutesOf(turnOnAt);
  const off = minutesOf(turnOffAt);
  if (on === null || off === null) return 0;
  const diff = (off - on + 1440) % 1440;
  return (diff === 0 ? 1440 : diff) / 60;
}

export function screenCapacity(
  screen: { turnOnAt: string; turnOffAt: string },
  spotsPerHour: number,
): number {
  return Math.round(
    operatingHours(screen.turnOnAt, screen.turnOffAt) * spotsPerHour,
  );
}

export function sameText(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? '').trim().toUpperCase() === (b ?? '').trim().toUpperCase();
}

export type DateChangeLogType = 'RENEWED' | 'EXTENDED' | 'SHORTENED';

/** Classifies a change of end date: renewed (it had already ended), extended or shortened. */
export function logTypeForEndDateChange(
  previousEnd: string | null,
  nextEnd: string | null,
  refIso: string,
): DateChangeLogType | null {
  if (!nextEnd) return null;
  if (!previousEnd) return 'EXTENDED';
  if (nextEnd > previousEnd) {
    return previousEnd < refIso ? 'RENEWED' : 'EXTENDED';
  }
  if (nextEnd < previousEnd) return 'SHORTENED';
  return null;
}
