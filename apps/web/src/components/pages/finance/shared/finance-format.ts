import { toYYYYMMDD } from "@/lib/format";

const AMOUNT_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return AMOUNT_FORMAT.format(value);
}

export interface FinanceDateRangeValue {
  from: string;
  to: string;
}

export function currentMonthRange(): FinanceDateRangeValue {
  const now = new Date();
  return {
    from: toYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toYYYYMMDD(now),
  };
}

export function todayYYYYMMDD(): string {
  return toYYYYMMDD(new Date());
}

export function parseAmount(value: string): number {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
