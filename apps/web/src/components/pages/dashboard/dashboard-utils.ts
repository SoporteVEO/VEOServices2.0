import { format } from "date-fns";
import { es } from "date-fns/locale";

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const d = new Date(year, month - 1, 1);
  const raw = format(d, "MMM yy", { locale: es });
  return raw[0] ? raw[0].toUpperCase() + raw.slice(1) : raw;
}

export function formatCompactMoney(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(fractionDigits)}%`;
}
