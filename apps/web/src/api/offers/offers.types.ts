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
  customerBillingEmail?: string | null;
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

export type OfferStatus = "PENDING" | "DECLINED" | "ACCEPTED";

export interface BriloContractOption {
  mconId: number;
  mconCodigo: string;
  mconFecha: string;
  ejecNombre: string | null;
}

export interface PaginatedBriloContracts {
  data: BriloContractOption[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BriloContractsQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface OfferDetailItem {
  id: string;
  billboardId: number | null;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
  impressionPrice: number;
  rentalPrice: number;
  startDate: string | null;
  endDate: string | null;
}

export interface OfferDetail extends OfferListItem {
  items: OfferDetailItem[];
  linkedBriloContract: BriloContractOption | null;
}

export interface UpdateOfferInput {
  status: OfferStatus;
  briloMconId?: number;
}

export interface OfferListItem {
  id: string;
  offerNumber: string;
  clientId: string | null;
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  customerBillingEmail: string | null;
  customerContact: string | null;
  validUntil: string;
  specialConditions: string | null;
  advisorFullName: string | null;
  status: OfferStatus;
  briloMconId: number | null;
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

export interface PaginatedMyOffers {
  data: OfferListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MyOffersQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface MyOffersStatusBreakdown {
  count: number;
  totalRental: number;
  totalImpression: number;
}

export interface MyOffersTrendPoint {
  monthKey: string;
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  pendingAmount: number;
  acceptedAmount: number;
  declinedAmount: number;
}

export interface MyOffersSummary {
  range: { from: string; to: string };
  totals: {
    count: number;
    totalRental: number;
    totalImpression: number;
  };
  byStatus: {
    pending: MyOffersStatusBreakdown;
    accepted: MyOffersStatusBreakdown;
    declined: MyOffersStatusBreakdown;
  };
  trend: MyOffersTrendPoint[];
}
