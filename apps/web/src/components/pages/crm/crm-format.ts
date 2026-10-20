import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

export function personName(person: {
  firstName: string;
  lastName: string | null;
}): string {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

export function personInitials(person: {
  firstName: string;
  lastName: string | null;
}): string {
  return [person.firstName, person.lastName]
    .filter(Boolean)
    .map((part) => part!.trim()[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function clientLabel(client: { name: string } | null): string | null {
  return client?.name ?? null;
}

export function timeAgo(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: es });
}

export function formatCompactMoney(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** Expected-close dates are stored as calendar dates (UTC midnight). */
export function calendarDate(value: string): Date {
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function toCalendarIso(date: Date): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();
}

const DEFAULT_COUNTRY_CODE = "503";

/** Mirrors the API's `normalizePhone`: 8-digit local numbers get the SV code. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 8 ? `${DEFAULT_COUNTRY_CODE}${digits}` : digits;
}

export function waLink(phone: string, text?: string): string {
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${normalizePhone(phone)}${query}`;
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
