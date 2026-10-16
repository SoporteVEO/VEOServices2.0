import type { OfferEditReason } from "@/api/offers/offers.types";
import type { OfferItem } from "./offer-types";

export const OFFER_EDIT_REASON_LABELS: Record<OfferEditReason, string> = {
  CLIENT_BUDGET: "Presupuesto del cliente",
  CAMPAIGN_SCOPE: "Cambio en el alcance de la campaña",
  AVAILABILITY: "Disponibilidad de vallas",
  LOCATION: "Ubicación o cobertura",
  PRICE_NEGOTIATION: "Negociación de precio",
  CAMPAIGN_DATES: "Cambio de fechas",
  CORRECTION: "Corrección de un error",
  OTHER: "Otro",
};

export const OFFER_EDIT_REASON_OPTIONS = (
  Object.entries(OFFER_EDIT_REASON_LABELS) as [OfferEditReason, string][]
).map(([value, label]) => ({ value, label }));

function billboardKey(item: OfferItem): string | null {
  if (item.type === "STATIC_BILLBOARD") {
    return `static:${item.billboardCode ?? item.billboardId ?? "sin-valla"}`;
  }
  if (item.type === "DIGITAL_BILLBOARD") {
    return `digital:${item.digitalBillboardId ?? "sin-valla"}`;
  }
  return null;
}

/** Mirrors the API rule: a reason is required once the billboard set changes. */
export function billboardsChanged(
  before: OfferItem[],
  after: OfferItem[],
): boolean {
  const toKeys = (items: OfferItem[]) =>
    new Set(items.map(billboardKey).filter((key): key is string => key !== null));
  const beforeKeys = toKeys(before);
  const afterKeys = toKeys(after);
  if (beforeKeys.size !== afterKeys.size) return true;
  for (const key of afterKeys) {
    if (!beforeKeys.has(key)) return true;
  }
  return false;
}
