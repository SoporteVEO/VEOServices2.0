import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Client, PaginatedClients } from "./clients.types";

export type { Client, PaginatedClients } from "./clients.types";

export interface ListClientsQuery {
  search?: string;
  limit?: number;
}

function buildParams(
  query: ListClientsQuery,
  cursor: string | undefined,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.search) params.search = query.search;
  if (query.limit) params.limit = String(query.limit);
  if (cursor) params.cursor = cursor;
  return params;
}

export async function getClientsPage(
  query: ListClientsQuery = {},
  cursor?: string,
): Promise<PaginatedClients> {
  return apiFetch<PaginatedClients>("/clients", {
    method: "GET",
    query: buildParams(query, cursor),
  });
}

export function useClientsInfinite(query: ListClientsQuery = {}) {
  return useInfiniteQuery({
    queryKey: ["clients", "list", query],
    queryFn: ({ pageParam }) =>
      getClientsPage(query, pageParam ?? undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export async function getClient(id: string): Promise<Client> {
  const response = await apiFetch<{ data: Client }>(`/clients/${id}`);
  return response.data;
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => getClient(id as string),
    enabled: !!id,
  });
}
