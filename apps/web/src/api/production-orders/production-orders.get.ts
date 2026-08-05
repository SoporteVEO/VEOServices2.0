import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  PaginatedProductionOrders,
  ProductionDocumentKind,
  ProductionOrder,
  ProductionOrdersQuery,
} from "./production-orders.types";

const STALE_TIME = 60 * 1000;
const GC_TIME = 5 * 60 * 1000;

export type ProductionOrdersScope = "mine" | "all";

function buildQuery(params: ProductionOrdersQuery): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.pageSize) query.pageSize = String(params.pageSize);
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  return query;
}

type QueryWithViewAs = ProductionOrdersQuery & { viewAsUserId?: string | null };

export async function getProductionOrders(
  scope: ProductionOrdersScope,
  params: QueryWithViewAs = {},
): Promise<PaginatedProductionOrders> {
  const path = scope === "mine" ? "/production-orders/mine" : "/production-orders";
  const query = buildQuery(params);
  if (scope === "mine" && params.viewAsUserId) {
    query.viewAsUserId = params.viewAsUserId;
  }
  return apiFetch<PaginatedProductionOrders>(path, { query });
}

export function useProductionOrders(
  scope: ProductionOrdersScope,
  params: QueryWithViewAs = {},
) {
  return useQuery({
    queryKey: [
      "production-orders",
      scope,
      params.page ?? 1,
      params.pageSize ?? null,
      params.search ?? "",
      params.status ?? null,
      params.viewAsUserId ?? null,
    ],
    queryFn: () => getProductionOrders(scope, params),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getProductionOrderById(
  id: string,
  options: { viewAsUserId?: string | null } = {},
): Promise<ProductionOrder> {
  const query: Record<string, string> = {};
  if (options.viewAsUserId) query.viewAsUserId = options.viewAsUserId;
  const response = await apiFetch<{ data: ProductionOrder }>(
    `/production-orders/${id}`,
    { query },
  );
  return response.data;
}

export function useProductionOrder(
  id: string | null,
  options: { viewAsUserId?: string | null } = {},
) {
  return useQuery({
    queryKey: [
      "production-orders",
      "detail",
      id,
      options.viewAsUserId ?? null,
    ],
    queryFn: () =>
      getProductionOrderById(id as string, {
        viewAsUserId: options.viewAsUserId ?? null,
      }),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export async function getProductionOrderDocumentUrl(
  itemId: string,
  kind: ProductionDocumentKind,
): Promise<string> {
  const path =
    kind === "PRODUCTION"
      ? `/production-orders/items/${itemId}/production-document/download-url`
      : `/production-orders/items/${itemId}/design-document/download-url`;
  const response = await apiFetch<{ url: string }>(path);
  return response.url;
}
