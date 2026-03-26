import { format, getDaysInMonth } from "date-fns";
import type { DigitalBillboardSpotUsage } from "@/api/digital-billboards/digital-billboards.spots";

export type SpotDayStyle = "green" | "yellow" | "red";

export const spotStyleClass: Record<SpotDayStyle, string> = {
  green:
    "!bg-emerald-500/50 !text-emerald-950 hover:!bg-emerald-500/35 active:!bg-emerald-500/30 focus-visible:!bg-emerald-500/30 dark:!text-emerald-50",
  yellow:
    "!bg-amber-400/35 !text-amber-950 hover:!bg-amber-400/45 active:!bg-amber-400/40 focus-visible:!bg-amber-400/40 dark:!text-amber-50",
  red: "!bg-red-500/30 !text-red-950 hover:!bg-red-500/40 active:!bg-red-500/35 focus-visible:!bg-red-500/35 dark:!text-red-50",
};

export function aggregateSpotsByLocalDay(
  usages: DigitalBillboardSpotUsage[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const u of usages) {
    const key = format(new Date(u.timestamp), "yyyy-MM-dd");
    map.set(key, (map.get(key) ?? 0) + u.duration);
  }
  return map;
}

export function getSpotDayStyle(
  spots: number,
  maxSpots: number,
): SpotDayStyle {
  if (spots >= maxSpots) return "red";
  if (spots < 300) return "green";
  if (spots < 600) return "yellow";
  return "red";
}

export function localDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function filterUsagesForLocalDay(
  usages: DigitalBillboardSpotUsage[],
  day: Date,
): DigitalBillboardSpotUsage[] {
  const key = localDayKey(day);
  return usages.filter(
    (u) => format(new Date(u.timestamp), "yyyy-MM-dd") === key,
  );
}

export function totalSpotsOnLocalDay(
  spotsByDay: Map<string, number>,
  day: Date,
): number {
  return spotsByDay.get(localDayKey(day)) ?? 0;
}

export function sumSpotDurations(usages: DigitalBillboardSpotUsage[]): number {
  return usages.reduce((acc, u) => acc + u.duration, 0);
}

export function monthSpotsCapacity(maxSpotsPerDay: number, month: Date): number {
  return maxSpotsPerDay * getDaysInMonth(month);
}

/** Distinct campaign labels; null/empty names share one bucket. */
export function uniqueCampaignCount(usages: DigitalBillboardSpotUsage[]): number {
  const keys = new Set(
    usages.map((u) => {
      const n = u.campaignName?.trim();
      return n && n.length > 0 ? n : "—";
    }),
  );
  return keys.size;
}

export function spotUsagePercent(
  used: number,
  capacity: number,
): number | null {
  if (capacity <= 0) return null;
  return Math.round((used / capacity) * 1000) / 10;
}

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value}%`;
}
