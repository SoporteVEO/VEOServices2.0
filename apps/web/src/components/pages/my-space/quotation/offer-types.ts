import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import type { DigitalBillboard } from "@/api/digital-billboards/digital-billboards.get";
import type { OfferItemType } from "@/api/offers/offers.types";

export const IVA_RATE = 0.13;
export const IMPRESSION_RATE_PER_M2 = 13;
export const ALLOWED_SPOT_COUNTS = [300, 450, 600, 900] as const;
export type AllowedSpotCount = (typeof ALLOWED_SPOT_COUNTS)[number];

interface OfferItemBase {
  id: string;
  type: OfferItemType;
  quantity: number;
  taxRate: number;
  startDate: Date | null;
  endDate: Date | null;
}

export interface StaticOfferItem extends OfferItemBase {
  type: "STATIC_BILLBOARD";
  billboardId: number;
  billboardCode: string | null;
  description: string;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  impressionPrice: number;
  /** Per 30-day period base rate from the billboard catalog. */
  monthlyRentalPrice: number;
  /** Total rental for the selected duration. */
  rentalPrice: number;
}

export interface DigitalOfferItem extends OfferItemBase {
  type: "DIGITAL_BILLBOARD";
  digitalBillboardId: string;
  billboardCode: string | null;
  name: string;
  address: string | null;
  /** Daily price per spot pack, e.g., $X for 300 spots. */
  unitPrice: number;
  spotCount: AllowedSpotCount;
  /** Total rental amount for the date range. */
  rentalPrice: number;
}

export interface MiscOfferItem extends OfferItemBase {
  type: "MISC";
  description: string;
  /** Per-unit price for this concept. */
  unitPrice: number;
  /** quantity * unitPrice */
  rentalPrice: number;
}

export type OfferItem = StaticOfferItem | DigitalOfferItem | MiscOfferItem;

export interface OfferTotals {
  subtotalImpression: number;
  ivaImpression: number;
  totalImpression: number;
  subtotalRental: number;
  ivaRental: number;
  totalRental: number;
  /** Grand total = totalImpression + totalRental */
  grandTotal: number;
}

const MS_PER_DAY = 86_400_000;
const RENTAL_PERIOD_DAYS = 30;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function stripTime(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

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

/** Inclusive day count between two dates (minimum 1). */
export function calculateInclusiveDays(
  startDate: Date | null,
  endDate: Date | null,
): number {
  if (!startDate || !endDate) return 1;
  const start = stripTime(startDate);
  const end = stripTime(endDate);
  if (end < start) return 1;
  return (
    Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
  );
}

export function calculateStaticRentalPrice(
  monthlyRentalPrice: number,
  startDate: Date | null,
  endDate: Date | null,
): number {
  const months = calculateRentalMonths(startDate, endDate);
  return round2(Math.max(0, monthlyRentalPrice) * months);
}

export function calculateDigitalRentalPrice(
  unitPrice: number,
  startDate: Date | null,
  endDate: Date | null,
): number {
  const days = calculateInclusiveDays(startDate, endDate);
  return round2(Math.max(0, unitPrice) * days);
}

export function formatRentalPeriodMultiplier(periods: number): string {
  if (periods <= 1) return "× 1";
  return `× ${periods}`;
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

export function buildStaticItemDescription(b: AvailableBillboardListing): string {
  const location = [b.cityName, b.departmentName].filter(Boolean).join(", ");
  const parts = [b.address, location].filter(
    (s): s is string => !!s && s.trim().length > 0,
  );
  return parts.join(" · ") || "—";
}

export function staticBillboardToOfferItem(
  b: AvailableBillboardListing,
  defaults?: { startDate?: Date | null; endDate?: Date | null },
): StaticOfferItem {
  const startDate = defaults?.startDate ?? null;
  const endDate = defaults?.endDate ?? null;
  const monthlyRentalPrice = b.price ?? 0;
  return {
    id: `static-${b.billboardId}`,
    type: "STATIC_BILLBOARD",
    billboardId: b.billboardId,
    billboardCode: b.billboardCode,
    description: buildStaticItemDescription(b),
    cityName: b.cityName,
    departmentName: b.departmentName,
    width: b.width,
    height: b.height,
    quantity: 1,
    impressionPrice: calculateImpressionPrice(b.width, b.height),
    monthlyRentalPrice,
    rentalPrice: calculateStaticRentalPrice(monthlyRentalPrice, startDate, endDate),
    taxRate: IVA_RATE,
    startDate,
    endDate,
  };
}

export function digitalBillboardToOfferItem(
  b: DigitalBillboard,
  defaults?: { startDate?: Date | null; endDate?: Date | null },
): DigitalOfferItem {
  const startDate = defaults?.startDate ?? null;
  const endDate = defaults?.endDate ?? null;
  const unitPrice = b.price ?? 0;
  const spotCount: AllowedSpotCount = 600;
  return {
    id: `digital-${b.id}`,
    type: "DIGITAL_BILLBOARD",
    digitalBillboardId: b.id,
    billboardCode: b.code ?? null,
    name: b.name,
    address: b.address ?? null,
    quantity: 1,
    unitPrice,
    spotCount,
    rentalPrice: calculateDigitalRentalPrice(unitPrice, startDate, endDate),
    taxRate: IVA_RATE,
    startDate,
    endDate,
  };
}

export function buildMiscOfferItem(): MiscOfferItem {
  return {
    id: `misc-${crypto.randomUUID()}`,
    type: "MISC",
    description: "",
    quantity: 1,
    unitPrice: 0,
    rentalPrice: 0,
    taxRate: IVA_RATE,
    startDate: null,
    endDate: null,
  };
}

export function applyStaticItemDateRange(
  item: StaticOfferItem,
  startDate: Date | null,
  endDate: Date | null,
): StaticOfferItem {
  return {
    ...item,
    startDate,
    endDate,
    rentalPrice: calculateStaticRentalPrice(
      item.monthlyRentalPrice,
      startDate,
      endDate,
    ),
  };
}

export function applyDigitalItemDateRange(
  item: DigitalOfferItem,
  startDate: Date | null,
  endDate: Date | null,
): DigitalOfferItem {
  return {
    ...item,
    startDate,
    endDate,
    rentalPrice: calculateDigitalRentalPrice(
      item.unitPrice,
      startDate,
      endDate,
    ),
  };
}

export function recalculateMiscRental(
  item: MiscOfferItem,
  unitPrice: number = item.unitPrice,
  quantity: number = item.quantity,
): MiscOfferItem {
  return {
    ...item,
    unitPrice,
    quantity,
    rentalPrice: round2(Math.max(0, unitPrice) * Math.max(1, quantity)),
  };
}

export function computeOfferTotals(items: OfferItem[]): OfferTotals {
  let subtotalImpression = 0;
  let subtotalRental = 0;
  let ivaImpression = 0;
  let ivaRental = 0;

  for (const item of items) {
    const lineImpression =
      item.type === "STATIC_BILLBOARD"
        ? item.impressionPrice * item.quantity
        : 0;
    const lineRental = item.rentalPrice * item.quantity;
    subtotalImpression += lineImpression;
    subtotalRental += lineRental;
    ivaImpression += lineImpression * item.taxRate;
    ivaRental += lineRental * item.taxRate;
  }

  const subImp = round2(subtotalImpression);
  const subRen = round2(subtotalRental);
  const ivaImp = round2(ivaImpression);
  const ivaRen = round2(ivaRental);
  const totalImp = round2(subImp + ivaImp);
  const totalRen = round2(subRen + ivaRen);

  return {
    subtotalImpression: subImp,
    ivaImpression: ivaImp,
    totalImpression: totalImp,
    subtotalRental: subRen,
    ivaRental: ivaRen,
    totalRental: totalRen,
    grandTotal: round2(totalImp + totalRen),
  };
}
