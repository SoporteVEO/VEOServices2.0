import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";

export const IVA_RATE = 0.13;
export const IMPRESSION_RATE_PER_M2 = 13;

export interface QuotationItem {
  id: string;
  billboardId: number;
  billboardCode: string | null;
  description: string;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
  impressionPrice: number;
  /** Per 30-day period base rate from the billboard catalog. */
  monthlyRentalPrice: number;
  /** Total rental for the selected duration (monthlyRentalPrice × 30-day periods). */
  rentalPrice: number;
  startDate: Date | null;
  endDate: Date | null;
}

export interface QuotationData {
  offerNumber: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerBillingEmail: string;
  customerContact: string;
  validUntil: Date;
  specialConditions: string;
  advisorFullName: string | null;
  items: QuotationItem[];
}

export interface QuotationTotals {
  subtotalImpression: number;
  ivaImpression: number;
  totalImpression: number;
  subtotalRental: number;
  ivaRental: number;
  totalRental: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function stripTime(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

const MS_PER_DAY = 86_400_000;
const RENTAL_PERIOD_DAYS = 30;

/** Inclusive 30-day billing periods between start and end (minimum 1). */
export function calculateRentalMonths(
  startDate: Date | null,
  endDate: Date | null,
): number {
  if (!startDate || !endDate) return 1;
  const start = stripTime(startDate);
  const end = stripTime(endDate);
  if (end < start) return 1;
  const inclusiveDays =
    Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  return Math.max(1, Math.ceil(inclusiveDays / RENTAL_PERIOD_DAYS));
}

export function calculateRentalPrice(
  monthlyRentalPrice: number,
  startDate: Date | null,
  endDate: Date | null,
): number {
  const months = calculateRentalMonths(startDate, endDate);
  return round2(Math.max(0, monthlyRentalPrice) * months);
}

export function formatRentalPeriodMultiplier(periods: number): string {
  if (periods <= 1) return "× 1";
  return `× ${periods}`;
}

export function formatRentalSubtotalPeriodsHint(
  items: Pick<QuotationItem, "startDate" | "endDate">[],
): string | null {
  if (items.length === 0) return null;
  const periodCounts = items.map((item) =>
    calculateRentalMonths(item.startDate, item.endDate),
  );
  const unique = [...new Set(periodCounts)].sort((a, b) => a - b);
  if (unique.length === 1) {
    return formatRentalPeriodMultiplier(unique[0]!);
  }
  return unique.map((n) => formatRentalPeriodMultiplier(n)).join(", ");
}

export function calculateImpressionPrice(
  width: number | null,
  height: number | null,
): number {
  if (width == null || height == null) return 0;
  const area = width * height;
  if (!Number.isFinite(area) || area <= 0) return 0;
  return round2(area * IMPRESSION_RATE_PER_M2);
}

export function buildItemDescription(b: AvailableBillboardListing): string {
  const location = [b.cityName, b.departmentName].filter(Boolean).join(", ");
  const parts = [b.address, location].filter(
    (s): s is string => !!s && s.trim().length > 0,
  );
  return parts.join(" · ") || "—";
}

export function applyQuotationItemDateRange(
  item: QuotationItem,
  startDate: Date | null,
  endDate: Date | null,
): QuotationItem {
  return {
    ...item,
    startDate,
    endDate,
    rentalPrice: calculateRentalPrice(
      item.monthlyRentalPrice,
      startDate,
      endDate,
    ),
  };
}

export function billboardToQuotationItem(
  b: AvailableBillboardListing,
  defaults?: { startDate?: Date | null; endDate?: Date | null },
): QuotationItem {
  const startDate = defaults?.startDate ?? null;
  const endDate = defaults?.endDate ?? null;
  const monthlyRentalPrice = b.price ?? 0;
  return {
    id: String(b.billboardId),
    billboardId: b.billboardId,
    billboardCode: b.billboardCode,
    description: buildItemDescription(b),
    cityName: b.cityName,
    departmentName: b.departmentName,
    width: b.width,
    height: b.height,
    quantity: 1,
    impressionPrice: calculateImpressionPrice(b.width, b.height),
    monthlyRentalPrice,
    rentalPrice: calculateRentalPrice(monthlyRentalPrice, startDate, endDate),
    startDate,
    endDate,
  };
}

export function computeQuotationTotals(items: QuotationItem[]): QuotationTotals {
  const subtotalImpression = round2(
    items.reduce((sum, item) => sum + item.impressionPrice * item.quantity, 0),
  );
  const subtotalRental = round2(
    items.reduce((sum, item) => sum + item.rentalPrice * item.quantity, 0),
  );
  const ivaImpression = round2(subtotalImpression * IVA_RATE);
  const ivaRental = round2(subtotalRental * IVA_RATE);
  return {
    subtotalImpression,
    ivaImpression,
    totalImpression: round2(subtotalImpression + ivaImpression),
    subtotalRental,
    ivaRental,
    totalRental: round2(subtotalRental + ivaRental),
  };
}
