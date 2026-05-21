export interface OfferItemInput {
  billboardId?: number | null;
  billboardCode?: string | null;
  address?: string | null;
  cityName?: string | null;
  departmentName?: string | null;
  width?: number | null;
  height?: number | null;
  quantity: number;
  impressionPrice: number;
  rentalPrice: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CreateOfferInput {
  customerName: string;
  customerCompany?: string | null;
  customerEmail?: string | null;
  customerContact?: string | null;
  clientId?: string | null;
  validUntil: string;
  specialConditions?: string | null;
  /**
   * Optional. When omitted, the offer is created without a PDF and the
   * client should attach it later via `attachOfferPdf` once the real offer
   * number is known.
   */
  pdfBase64?: string;
  items: OfferItemInput[];
}

export interface AttachOfferPdfInput {
  pdfBase64: string;
}

export interface OfferListItem {
  id: string;
  offerNumber: string;
  clientId: string | null;
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  customerContact: string | null;
  validUntil: string;
  specialConditions: string | null;
  advisorFullName: string | null;
  subtotalImpression: number;
  ivaImpression: number;
  totalImpression: number;
  subtotalRental: number;
  ivaRental: number;
  totalRental: number;
  itemCount: number;
  hasPdf: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
}

export interface PaginatedOffers {
  data: OfferListItem[];
  nextCursor: string | null;
}
