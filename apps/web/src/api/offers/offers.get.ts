import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  BriloContractsQuery,
  MyOffersQuery,
  MyOffersSummary,
  OfferDetail,
  OfferListItem,
  PaginatedBriloContracts,
  PaginatedMyOffers,
  PaginatedOffers,
} from "./offers.types";

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

export async function getMyOffers(
  query: MyOffersQuery & { viewAsUserId?: string | null } = {},
): Promise<PaginatedMyOffers> {
  const params: Record<string, string> = {};
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.pageSize = String(query.pageSize);
  if (query.search) params.search = query.search;
  if (query.viewAsUserId) params.viewAsUserId = query.viewAsUserId;
  return apiFetch<PaginatedMyOffers>("/offers/mine", { query: params });
}

export function useMyOffers(
  query: MyOffersQuery & { viewAsUserId?: string | null } = {},
) {
  return useQuery({
    queryKey: [
      "offers",
      "mine",
      query.page ?? 1,
      query.pageSize ?? null,
      query.search ?? "",
      query.viewAsUserId ?? null,
    ],
    queryFn: () => getMyOffers(query),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getMyOffersSummary(params: {
  from: string;
  to: string;
  viewAsUserId?: string | null;
}): Promise<MyOffersSummary> {
  const query: Record<string, string> = {
    from: params.from,
    to: params.to,
  };
  if (params.viewAsUserId) query.viewAsUserId = params.viewAsUserId;
  const response = await apiFetch<{ data: MyOffersSummary }>(
    "/offers/mine/summary",
    { query },
  );
  return response.data;
}

export function useMyOffersSummary(params: {
  from: string;
  to: string;
  enabled?: boolean;
  viewAsUserId?: string | null;
}) {
  return useQuery({
    queryKey: [
      "offers",
      "mine",
      "summary",
      params.from,
      params.to,
      params.viewAsUserId ?? null,
    ],
    queryFn: () =>
      getMyOffersSummary({
        from: params.from,
        to: params.to,
        viewAsUserId: params.viewAsUserId ?? null,
      }),
    enabled: params.enabled ?? true,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getOffer(
  id: string,
  options: { viewAsUserId?: string | null } = {},
): Promise<OfferDetail> {
  const query: Record<string, string> = {};
  if (options.viewAsUserId) query.viewAsUserId = options.viewAsUserId;
  const response = await apiFetch<{ data: OfferDetail }>(`/offers/${id}`, {
    query,
  });
  return response.data;
}

export function useOffer(
  id: string | null,
  options: { viewAsUserId?: string | null } = {},
) {
  return useQuery({
    queryKey: ["offers", id, options.viewAsUserId ?? null],
    queryFn: () =>
      getOffer(id as string, { viewAsUserId: options.viewAsUserId ?? null }),
    enabled: !!id,
  });
}

export async function getOfferDownloadUrl(
  id: string,
  options: { viewAsUserId?: string | null } = {},
): Promise<string> {
  const query: Record<string, string> = {};
  if (options.viewAsUserId) query.viewAsUserId = options.viewAsUserId;
  const response = await apiFetch<{ url: string }>(
    `/offers/${id}/download-url`,
    { query },
  );
  return response.url;
}

function buildBriloContractsParams(
  query: BriloContractsQuery,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.search) params.search = query.search;
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.pageSize = String(query.pageSize);
  return params;
}

export async function getBriloContractsPage(
  query: BriloContractsQuery = {},
): Promise<PaginatedBriloContracts> {
  return apiFetch<PaginatedBriloContracts>("/offers/brilo-contracts", {
    query: buildBriloContractsParams(query),
  });
}

export function useBriloContractsInfinite(query: BriloContractsQuery = {}) {
  return useInfiniteQuery({
    queryKey: ["offers", "brilo-contracts", query],
    queryFn: ({ pageParam }) =>
      getBriloContractsPage({
        ...query,
        page: pageParam ?? 1,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.pageSize;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export type { OfferListItem as Offer };
