import { MONTERREY_TZ } from '../modules/user-metrics/user-metrics.constants.js';

/**
 * The timezone the shop floor thinks in. Rules phrased per "day" - a press's
 * daily capacity, for instance - need a boundary that does not move with the
 * server's own clock, so they resolve against this zone rather than UTC or the
 * caller's offset. Re-exported from the metrics constants to keep one source
 * of truth for the business zone.
 */
export const BUSINESS_TZ = MONTERREY_TZ;

const PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const HOUR_MS = 60 * 60 * 1000;

/** Milliseconds the business zone is ahead of UTC at the given instant. */
function zoneOffsetMs(instant: Date): number {
  const parts = PARTS_FORMATTER.formatToParts(instant).reduce<
    Record<string, string>
  >((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  // Sub-second precision is irrelevant to a day boundary, so the seconds-level
  // formatter output is compared against a seconds-truncated instant.
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** The instant at which the business day containing `instant` begins. */
export function startOfBusinessDay(instant: Date): Date {
  const offset = zoneOffsetMs(instant);
  const shifted = new Date(instant.getTime() + offset);
  const localMidnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );

  const candidate = new Date(localMidnight - offset);
  // A day that starts inside a DST transition resolves to a different offset
  // than the reference instant, so the boundary is recomputed against it.
  const boundaryOffset = zoneOffsetMs(candidate);
  return boundaryOffset === offset
    ? candidate
    : new Date(localMidnight - boundaryOffset);
}

/**
 * Half-open `[start, end)` window covering the business day that contains
 * `instant`. The end is derived from the following midday so a short or long
 * DST day still lands on the correct next boundary.
 */
export function businessDayRange(instant: Date): { start: Date; end: Date } {
  const start = startOfBusinessDay(instant);
  return {
    start,
    end: startOfBusinessDay(new Date(start.getTime() + 36 * HOUR_MS)),
  };
}

/** `YYYY-MM-DD` of the business day containing `instant`. */
export function businessDayKey(instant: Date): string {
  const shifted = new Date(instant.getTime() + zoneOffsetMs(instant));
  return shifted.toISOString().slice(0, 10);
}
