import type { BriloClientOption } from "@/api/offers/offers.types";

export type ClientType = "DIRECT" | "AGENCY";

export interface Client {
  id: string;
  type: ClientType;
  name: string;
  company: string | null;
  email: string | null;
  billingEmail: string | null;
  contact: string | null;
  briloCliId: number | null;
  /** Only resolved when fetching, creating or updating a single client. */
  briloClient?: BriloClientOption | null;
  createdAt: string;
  updatedAt: string;
}

export type ClientContractStatus = "ACTIVE" | "UPCOMING" | "FINISHED";

export interface ClientContract {
  contractSourceId: number;
  contractNumber: string;
  description: string | null;
  brand: string | null;
  customerName: string | null;
  executiveName: string | null;
  agencyName: string | null;
  signedAt: string | null;
  startDate: string;
  endDate: string;
  totalBillboards: number;
  status: ClientContractStatus;
}

export interface ReportRecipient {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  isPrimary: boolean;
}

export interface ReportRecipients {
  client: { id: string; name: string } | null;
  contacts: ReportRecipient[];
}

export interface PaginatedClients {
  data: Client[];
  nextCursor: string | null;
}

export interface PaginatedClientsPage {
  data: Client[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateClientInput {
  type?: ClientType;
  name: string;
  company?: string | null;
  email?: string | null;
  billingEmail?: string | null;
  contact?: string | null;
  briloCliId?: number | null;
}

export interface UpdateClientInput {
  type?: ClientType;
  name?: string;
  company?: string | null;
  email?: string;
  billingEmail?: string | null;
  contact?: string | null;
  briloCliId?: number | null;
}
