import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface StaticBillboardCode {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedStaticBillboardCodes {
  data: StaticBillboardCode[];
  nextCursor: string | null;
}

export interface ListStaticBillboardCodesQuery {
  search?: string;
  limit?: number;
}

function buildParams(
  query: ListStaticBillboardCodesQuery,
  cursor: string | undefined,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.search) params.search = query.search;
  if (query.limit) params.limit = String(query.limit);
  if (cursor) params.cursor = cursor;
  return params;
}

export async function getStaticBillboardCodesPage(
  query: ListStaticBillboardCodesQuery = {},
  cursor?: string,
): Promise<PaginatedStaticBillboardCodes> {
  return apiFetch<PaginatedStaticBillboardCodes>("/static-billboard-codes", {
    method: "GET",
    query: buildParams(query, cursor),
  });
}

export function useStaticBillboardCodesInfinite(
  query: ListStaticBillboardCodesQuery = {},
) {
  return useInfiniteQuery({
    queryKey: ["static-billboard-codes", "list", query],
    queryFn: ({ pageParam }) =>
      getStaticBillboardCodesPage(query, pageParam ?? undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
