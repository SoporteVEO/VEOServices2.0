"use client";

import {
  OfferPdfDocument,
  type OfferPdfData,
} from "@/components/pages/my-space/quotation/offer-pdf-document";
import { IVA_RATE, type StaticOfferItem } from "@/components/pages/my-space/quotation/offer-types";
import type { QuotationData, QuotationItem } from "./quotation-types";

function toStaticOfferItem(item: QuotationItem): StaticOfferItem {
  return {
    id: item.id,
    type: "STATIC_BILLBOARD",
    billboardId: item.billboardId,
    billboardCode: item.billboardCode,
    description: item.description,
    cityName: item.cityName,
    departmentName: item.departmentName,
    width: item.width,
    height: item.height,
    quantity: item.quantity,
    impressionPrice: item.impressionPrice,
    monthlyRentalPrice: item.monthlyRentalPrice,
    rentalPrice: item.rentalPrice,
    taxRate: IVA_RATE,
    startDate: item.startDate,
    endDate: item.endDate,
  };
}

function toOfferPdfData(data: QuotationData): OfferPdfData {
  return {
    offerNumber: data.offerNumber,
    customerName: data.customerName,
    customerCompany: data.customerCompany,
    customerEmail: data.customerEmail,
    customerBillingEmail: data.customerBillingEmail,
    customerContact: data.customerContact,
    validUntil: data.validUntil,
    specialConditions: data.specialConditions,
    advisorFullName: data.advisorFullName,
    items: data.items.map(toStaticOfferItem),
  };
}

export interface QuotationPdfDocumentProps {
  data: QuotationData;
  logoSrc: string;
}

/**
 * Static-billboard quotations are offers with only static items, so they
 * render through the same document instead of maintaining a second layout
 * that inevitably drifts.
 */
export function QuotationPdfDocument({
  data,
  logoSrc,
}: QuotationPdfDocumentProps) {
  return <OfferPdfDocument data={toOfferPdfData(data)} logoSrc={logoSrc} />;
}
