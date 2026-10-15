export type ClientType = "DIRECT" | "AGENCY";

export interface Client {
  id: string;
  type: ClientType;
  name: string;
  company: string | null;
  email: string;
  billingEmail: string | null;
  contact: string | null;
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
  email: string;
  billingEmail?: string | null;
  contact?: string | null;
}

export interface UpdateClientInput {
  type?: ClientType;
  name?: string;
  company?: string | null;
  email?: string;
  billingEmail?: string | null;
  contact?: string | null;
}
