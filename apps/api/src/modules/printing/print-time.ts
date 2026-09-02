/**
 * Print durations are derived, not looked up: a press advertises a throughput
 * in m²/hour and a panel's area divided by that throughput is how long it
 * occupies the machine. The same area is what a machine's daily capacity is
 * measured against, so both live here.
 */

const MINUTES_PER_HOUR = 60;

/** Throughput of the shop's current press, used when none is configured. */
export const DEFAULT_PRINT_SPEED_M2_PER_HOUR = 85;

/**
 * Booked when a panel has no recorded dimensions. Such a job consumes no
 * measurable capacity, but it still has to reserve a realistic slot rather
 * than collapse to a minute.
 */
export const FALLBACK_PRINT_MINUTES = 45;

export interface PanelDimensions {
  width: number | null;
  height: number | null;
  quantity?: number | null;
}

/**
 * Printed area of an order item. Quantity multiplies it because each copy is
 * its own pass through the press - the same reason the offer bills impression
 * per unit.
 */
export function computeAreaM2(panel: PanelDimensions): number {
  const width = toPositive(panel.width);
  const height = toPositive(panel.height);
  if (width === null || height === null) return 0;

  const quantity = Math.max(1, Math.round(toPositive(panel.quantity) ?? 1));
  return round2(width * height * quantity);
}

/**
 * Minutes the press needs for `areaM2`, rounded up so a schedule never
 * promises more throughput than the machine can deliver.
 */
export function computePrintMinutes(
  areaM2: number,
  speedM2PerHour: number,
): number {
  if (!Number.isFinite(areaM2) || areaM2 <= 0) return FALLBACK_PRINT_MINUTES;

  const speed = toPositive(speedM2PerHour) ?? DEFAULT_PRINT_SPEED_M2_PER_HOUR;
  return Math.max(1, Math.ceil((areaM2 / speed) * MINUTES_PER_HOUR));
}

function toPositive(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
