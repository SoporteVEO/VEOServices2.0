export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string;
  billingEmail: string | null;
  contact: string | null;
  createdAt: string;
  updatedAt: string;
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
  name: string;
  company?: string | null;
  email: string;
  billingEmail?: string | null;
  contact?: string | null;
}

export interface UpdateClientInput {
  name?: string;
  company?: string | null;
  email?: string;
  billingEmail?: string | null;
  contact?: string | null;
}
