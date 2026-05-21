import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { OfferListItem, PaginatedOffers } from "./offers.types";

export type { OfferListItem, PaginatedOffers } from "./offers.types";

const STALE_TIME = 60 * 1000;
const GC_TIME = 5 * 60 * 1000;

export async function getOffers(params: {
  search?: string;
  cursor?: string;
  limit?: number;
}): Promise<PaginatedOffers> {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.cursor) query.cursor = params.cursor;
  if (params.limit) query.limit = String(params.limit);
  return apiFetch<PaginatedOffers>("/offers", { query });
}

export function useOffers(params: { search?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ["offers", params],
    queryFn: () => getOffers(params),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getOfferDownloadUrl(id: string): Promise<string> {
  const response = await apiFetch<{ url: string }>(`/offers/${id}/download-url`);
  return response.url;
}

export type { OfferListItem as Offer };
