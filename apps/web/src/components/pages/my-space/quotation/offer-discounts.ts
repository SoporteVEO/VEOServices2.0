import type { OfferDetailItem } from "@/api/offers/offers.types";
import { calculateStaticRentalPrice, type OfferItem, type StaticOfferItem } from "./offer-types";

/** A charged price measured against the recommended one, before IVA. */
export interface PriceDiscount {
  list: number;
  charged: number;
  amount: number;
  /** 0–100. */
  percent: number;
}

/** Unit prices of one line plus the recommended ones they were lowered from. */
export interface PricedLine {
  quantity: number;
  rentalPrice: number;
  impressionPrice: number;
  listRentalPrice: number | null;
  listImpressionPrice: number | null;
}

export interface OfferDiscountSummary {
  rental: PriceDiscount | null;
  impression: PriceDiscount | null;
  total: PriceDiscount | null;
}

const CENT = 0.005;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toDiscount(list: number, charged: number): PriceDiscount | null {
  const amount = round2(list - charged);
  if (list <= 0 || amount < CENT) return null;
  return {
    list: round2(list),
    charged: round2(charged),
    amount,
    percent: (amount / list) * 100,
  };
}

/** Per-unit discount; null when the price was kept or raised. */
export function priceDiscount(
  list: number | null,
  charged: number,
): PriceDiscount | null {
  return list == null ? null : toDiscount(list, charged);
}

export function staticListRentalPrice(item: StaticOfferItem): number | null {
  if (item.listMonthlyRentalPrice == null) return null;
  return calculateStaticRentalPrice(
    item.listMonthlyRentalPrice,
    item.startDate,
    item.endDate,
  );
}

export function staticPricedLine(item: StaticOfferItem): PricedLine {
  return {
    quantity: item.quantity,
    rentalPrice: item.rentalPrice,
    impressionPrice: item.impressionPrice,
    listRentalPrice: staticListRentalPrice(item),
    listImpressionPrice: item.listImpressionPrice,
  };
}

export function offerDetailPricedLines(items: OfferDetailItem[]): PricedLine[] {
  return items
    .filter((item) => item.itemType === "STATIC_BILLBOARD")
    .map((item) => ({
      quantity: item.quantity,
      rentalPrice: item.rentalPrice,
      impressionPrice: item.impressionPrice,
      listRentalPrice: item.listRentalPrice,
      listImpressionPrice: item.listImpressionPrice,
    }));
}

export function offerItemsPricedLines(items: OfferItem[]): PricedLine[] {
  return items
    .filter((item): item is StaticOfferItem => item.type === "STATIC_BILLBOARD")
    .map(staticPricedLine);
}

/**
 * Only lines with a recommended price count, and a line priced above it adds
 * no discount, so a surcharge on one billboard never hides a cut on another.
 */
export function summarizeDiscounts(lines: PricedLine[]): OfferDiscountSummary {
  let rentalList = 0;
  let rentalCut = 0;
  let impressionList = 0;
  let impressionCut = 0;

  for (const line of lines) {
    if (line.listRentalPrice != null) {
      rentalList += line.listRentalPrice * line.quantity;
      rentalCut +=
        Math.max(0, line.listRentalPrice - line.rentalPrice) * line.quantity;
    }
    if (line.listImpressionPrice != null) {
      impressionList += line.listImpressionPrice * line.quantity;
      impressionCut +=
        Math.max(0, line.listImpressionPrice - line.impressionPrice) *
        line.quantity;
    }
  }

  return {
    rental: toDiscount(rentalList, rentalList - rentalCut),
    impression: toDiscount(impressionList, impressionList - impressionCut),
    total: toDiscount(
      rentalList + impressionList,
      rentalList + impressionList - rentalCut - impressionCut,
    ),
  };
}

export function formatDiscountPercent(percent: number): string {
  const rounded = Math.round(percent * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}
