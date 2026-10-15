import { format } from "date-fns";
import { es } from "date-fns/locale";
import { calendarDate, toCalendarIso } from "./crm-format";

export function flightLabel(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (value: string) => format(calendarDate(value), "d MMM yy", { locale: es });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start ? `Desde ${fmt(start)}` : `Hasta ${fmt(end!)}`;
}

export function flightDays(start: Date, end: Date): number {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

/** Mirrors the API: monthly rates prorated on a 30-day month. */
export function prorate(rate: number, start: Date, end: Date): number {
  return Math.round(rate * (flightDays(start, end) / 30) * 100) / 100;
}

export function mapsLink(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** `YYYY-MM-DD` for query strings and DTOs that take calendar dates. */
export function isoDay(date: Date): string {
  return toCalendarIso(date).slice(0, 10);
}

export function sizeLabel(width: number | null, height: number | null): string | null {
  if (!width || !height) return null;
  return `${width} × ${height} m`;
}
