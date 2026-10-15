/** El Salvador has no DST, so its day boundaries are a fixed UTC-6 offset. */
const SV_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfTodaySv(now = new Date()): Date {
  const local = new Date(now.getTime() - SV_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + SV_OFFSET_MS);
}

export function endOfTodaySv(now = new Date()): Date {
  return new Date(startOfTodaySv(now).getTime() + DAY_MS);
}

export function startOfMonthSv(now = new Date()): Date {
  const local = new Date(now.getTime() - SV_OFFSET_MS);
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1);
  return new Date(start + SV_OFFSET_MS);
}

export function addMonths(date: Date, months: number): Date {
  const local = new Date(date.getTime() - SV_OFFSET_MS);
  const shifted = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth() + months,
    1,
  );
  return new Date(shifted + SV_OFFSET_MS);
}

/** `YYYY-MM` of the instant as seen in El Salvador. */
export function monthKeySv(date: Date): string {
  const local = new Date(date.getTime() - SV_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}`;
}
