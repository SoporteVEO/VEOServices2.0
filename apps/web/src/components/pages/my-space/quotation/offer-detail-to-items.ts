import type { OfferDetailItem } from "@/api/offers/offers.types";
import {
  ALLOWED_SPOT_COUNTS,
  calculateInclusiveDays,
  calculateRentalMonths,
  IVA_RATE,
  type AllowedSpotCount,
  type DigitalOfferItem,
  type MiscOfferItem,
  type OfferItem,
  type StaticOfferItem,
} from "./offer-types";

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toSpotCount(value: number | null): AllowedSpotCount {
  const match = ALLOWED_SPOT_COUNTS.find((allowed) => allowed === value);
  return match ?? 600;
}

/**
 * Rebuilds the editor's rich item model from what was persisted. The API only
 * stores the total rental for the selected range, so the per-period base rate
 * the editor recalculates from is derived back out of it.
 */
export function offerDetailItemsToOfferItems(
  items: OfferDetailItem[],
): OfferItem[] {
  return items.map((item): OfferItem => {
    const startDate = toDate(item.startDate);
    const endDate = toDate(item.endDate);

    if (item.itemType === "DIGITAL_BILLBOARD") {
      const days = calculateInclusiveDays(startDate, endDate);
      const digital: DigitalOfferItem = {
        id: item.id,
        type: "DIGITAL_BILLBOARD",
        digitalBillboardId: item.digitalBillboardId ?? "",
        billboardCode: item.billboardCode,
        name: item.description ?? item.billboardCode ?? "Valla digital",
        address: item.address,
        quantity: item.quantity,
        unitPrice: round2(item.rentalPrice / Math.max(1, days)),
        spotCount: toSpotCount(item.spotCount),
        rentalPrice: item.rentalPrice,
        taxRate: item.taxRate ?? IVA_RATE,
        startDate,
        endDate,
      };
      return digital;
    }

    if (item.itemType === "MISC") {
      const misc: MiscOfferItem = {
        id: item.id,
        type: "MISC",
        description: item.description ?? "",
        quantity: item.quantity,
        unitPrice: round2(item.rentalPrice / Math.max(1, item.quantity)),
        rentalPrice: item.rentalPrice,
        taxRate: item.taxRate ?? IVA_RATE,
        startDate,
        endDate,
      };
      return misc;
    }

    const months = calculateRentalMonths(startDate, endDate);
    const location = [item.cityName, item.departmentName]
      .filter(Boolean)
      .join(", ");
    const staticItem: StaticOfferItem = {
      id: item.id,
      type: "STATIC_BILLBOARD",
      billboardId: item.billboardId ?? 0,
      billboardCode: item.billboardCode,
      description:
        [item.address, location].filter(Boolean).join(" · ") || "—",
      cityName: item.cityName,
      departmentName: item.departmentName,
      width: item.width,
      height: item.height,
      quantity: item.quantity,
      impressionPrice: item.impressionPrice,
      monthlyRentalPrice: round2(item.rentalPrice / Math.max(1, months)),
      rentalPrice: item.rentalPrice,
      taxRate: item.taxRate ?? IVA_RATE,
      startDate,
      endDate,
    };
    return staticItem;
  });
}
