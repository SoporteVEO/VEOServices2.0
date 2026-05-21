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
  rentalPrice: number;
  startDate: Date | null;
  endDate: Date | null;
}

export interface QuotationData {
  offerNumber: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
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

export function billboardToQuotationItem(
  b: AvailableBillboardListing,
  defaults?: { startDate?: Date | null; endDate?: Date | null },
): QuotationItem {
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
    rentalPrice: b.price ?? 0,
    startDate: defaults?.startDate ?? null,
    endDate: defaults?.endDate ?? null,
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
