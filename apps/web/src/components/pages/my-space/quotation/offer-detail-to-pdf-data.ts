import type { OfferDetail } from "@/api/offers/offers.types";
import { offerDetailItemsToOfferItems } from "./offer-detail-to-items";
import type { OfferPdfData } from "./offer-pdf-document";

/**
 * Rebuilds the PDF payload from a stored offer so downloads always render with
 * the current template instead of whichever design was archived at creation.
 */
export function offerDetailToPdfData(offer: OfferDetail): OfferPdfData {
  return {
    offerNumber: offer.offerNumber,
    customerName: offer.customerName,
    customerCompany: offer.customerCompany ?? "",
    customerEmail: offer.customerEmail ?? "",
    customerBillingEmail: offer.customerBillingEmail ?? "",
    customerContact: offer.customerContact ?? "",
    validUntil: new Date(offer.validUntil),
    specialConditions: offer.specialConditions ?? "",
    advisorFullName: offer.advisorFullName,
    items: offerDetailItemsToOfferItems(offer.items),
    generatedAt: new Date(offer.createdAt),
  };
}
