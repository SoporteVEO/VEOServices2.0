const LOCALE = "es-SV";

export function todayIso(): string {
  return localIsoDate(new Date());
}

export function localIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIso(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function daysUntil(refIso: string, targetIso: string | null): number | null {
  const ref = parseIso(refIso);
  const target = parseIso(targetIso);
  if (!ref || !target) return null;
  return daysBetween(ref, target);
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseIso(iso) ?? new Date();
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
}

export function formatIso(value: string | null | undefined): string {
  const date = parseIso(value);
  if (!date) return "—";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${String(date.getFullYear()).slice(2)}`;
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

export function formatDayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (localIsoDate(date) === localIsoDate(today)) return "hoy";
  if (localIsoDate(date) === localIsoDate(yesterday)) return "ayer";
  return date.toLocaleDateString(LOCALE, { day: "numeric", month: "short" }).replace(".", "");
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatDayLabel(date)} ${formatClock(date)}`;
}

export function formatCount(value: number | null | undefined): string {
  return (Number(value) || 0).toLocaleString(LOCALE);
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `$${value.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatSpotMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `$${value.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function formatMoneyRange(
  min: number | null,
  max: number | null,
  perSpot = false,
): string {
  const format = perSpot ? formatSpotMoney : formatMoney;
  if (min === null) return "—";
  return max === null || Math.abs(max - min) < 0.00005
    ? format(min)
    : `${format(min)} – ${format(max)}`;
}

export function formatHours(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatShortHours(hours: number): string {
  return `${hours % 1 ? String(hours).replace(".", ",") : hours} h`;
}

export function minutesOf(hhmm: string | null | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function toHHMM(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function formatClock12(hhmm: string | null | undefined): string {
  const total = minutesOf(hhmm);
  if (total === null) return "—";
  const h = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return count === 1 ? singular : pluralForm;
}

export function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function sameText(a: string | null | undefined, b: string | null | undefined) {
  return String(a ?? "").trim().toUpperCase() === String(b ?? "").trim().toUpperCase();
}

export function clientKey(value: string | null | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

export function parseAmount(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function fileStamp(refIso: string): string {
  return refIso.replace(/-/g, "");
}
