export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string;
  contact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedClients {
  data: Client[];
  nextCursor: string | null;
}

export interface CreateClientInput {
  name: string;
  company?: string | null;
  email: string;
  contact?: string | null;
}
