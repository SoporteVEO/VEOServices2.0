import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  OffersAnalyticsList,
  OffersAnalyticsOverview,
  ReportsAnalyticsOverview,
  SalesByCostCenterReport,
  UserAppUsageReport,
} from "./analytics.types";

export const userAppUsageQueryKey = (from: string, to: string) =>
  ["analytics", "user-app-usage", from, to] as const;

export async function getUserAppUsageReport(from: string, to: string) {
  const response = await apiFetch<{ data: UserAppUsageReport }>(
    "/analytics/user-app-usage",
    { query: { from, to } },
  );
  return response.data;
}

export function useUserAppUsageReport(from: string, to: string) {
  return useQuery({
    queryKey: userAppUsageQueryKey(from, to),
    queryFn: () => getUserAppUsageReport(from, to),
    enabled: Boolean(from && to && from <= to),
  });
}

export const salesByCostCenterQueryKey = (from: string, to: string) =>
  ["analytics", "sales-by-cost-center", from, to] as const;

export async function getSalesByCostCenterReport(from: string, to: string) {
  const response = await apiFetch<{ data: SalesByCostCenterReport }>(
    "/analytics/sales-by-cost-center",
    { query: { from, to } },
  );
  return response.data;
}

export function useSalesByCostCenterReport(from: string, to: string) {
  return useQuery({
    queryKey: salesByCostCenterQueryKey(from, to),
    queryFn: () => getSalesByCostCenterReport(from, to),
    enabled: Boolean(from && to && from <= to),
  });
}

export const mySalesByCostCenterQueryKey = (
  from: string,
  to: string,
  viewAsUserId: string | null = null,
) =>
  [
    "analytics",
    "sales-by-cost-center",
    "mine",
    from,
    to,
    viewAsUserId,
  ] as const;

export async function getMySalesByCostCenterReport(
  from: string,
  to: string,
  options: { viewAsUserId?: string | null } = {},
) {
  const query: Record<string, string> = { from, to };
  if (options.viewAsUserId) query.viewAsUserId = options.viewAsUserId;
  const response = await apiFetch<{ data: SalesByCostCenterReport }>(
    "/analytics/sales-by-cost-center/mine",
    { query },
  );
  return response.data;
}

export function useMySalesByCostCenterReport(
  from: string,
  to: string,
  options: { viewAsUserId?: string | null } = {},
) {
  const viewAsUserId = options.viewAsUserId ?? null;
  return useQuery({
    queryKey: mySalesByCostCenterQueryKey(from, to, viewAsUserId),
    queryFn: () => getMySalesByCostCenterReport(from, to, { viewAsUserId }),
    enabled: Boolean(from && to && from <= to),
  });
}

const ANALYTICS_STALE_TIME = 30 * 1000;
const ANALYTICS_GC_TIME = 5 * 60 * 1000;

export const offersAnalyticsOverviewQueryKey = (
  from: string,
  to: string,
  userId: string | null,
) => ["analytics", "offers-overview", from, to, userId] as const;

export async function getOffersAnalyticsOverview(
  from: string,
  to: string,
  options: { userId?: string | null } = {},
) {
  const query: Record<string, string> = { from, to };
  if (options.userId) query.userId = options.userId;
  const response = await apiFetch<{ data: OffersAnalyticsOverview }>(
    "/analytics/offers-overview",
    { query },
  );
  return response.data;
}

export function useOffersAnalyticsOverview(
  from: string,
  to: string,
  options: { userId?: string | null } = {},
) {
  const userId = options.userId ?? null;
  return useQuery({
    queryKey: offersAnalyticsOverviewQueryKey(from, to, userId),
    queryFn: () => getOffersAnalyticsOverview(from, to, { userId }),
    enabled: Boolean(from && to && from <= to),
    staleTime: ANALYTICS_STALE_TIME,
    gcTime: ANALYTICS_GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export const offersAnalyticsListQueryKey = (
  from: string,
  to: string,
  userId: string | null,
  page: number,
  pageSize: number,
  search: string,
) =>
  [
    "analytics",
    "offers-overview",
    "list",
    from,
    to,
    userId,
    page,
    pageSize,
    search,
  ] as const;

export async function getOffersAnalyticsList(
  from: string,
  to: string,
  options: {
    userId?: string | null;
    page?: number;
    pageSize?: number;
    search?: string | null;
  } = {},
) {
  const query: Record<string, string> = { from, to };
  if (options.userId) query.userId = options.userId;
  if (options.page) query.page = String(options.page);
  if (options.pageSize) query.pageSize = String(options.pageSize);
  if (options.search) query.search = options.search;
  return apiFetch<OffersAnalyticsList>("/analytics/offers-overview/list", {
    query,
  });
}

export function useOffersAnalyticsList(
  from: string,
  to: string,
  options: {
    userId?: string | null;
    page?: number;
    pageSize?: number;
    search?: string | null;
    enabled?: boolean;
  } = {},
) {
  const userId = options.userId ?? null;
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 25;
  const search = options.search?.trim() ?? "";
  return useQuery({
    queryKey: offersAnalyticsListQueryKey(
      from,
      to,
      userId,
      page,
      pageSize,
      search,
    ),
    queryFn: () =>
      getOffersAnalyticsList(from, to, {
        userId,
        page,
        pageSize,
        search: search || null,
      }),
    enabled:
      (options.enabled ?? true) && Boolean(from && to && from <= to),
    staleTime: ANALYTICS_STALE_TIME,
    gcTime: ANALYTICS_GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export const reportsAnalyticsOverviewQueryKey = (
  from: string,
  to: string,
  userId: string | null,
) => ["analytics", "reports-overview", from, to, userId] as const;

export async function getReportsAnalyticsOverview(
  from: string,
  to: string,
  options: { userId?: string | null } = {},
) {
  const query: Record<string, string> = { from, to };
  if (options.userId) query.userId = options.userId;
  const response = await apiFetch<{ data: ReportsAnalyticsOverview }>(
    "/analytics/reports-overview",
    { query },
  );
  return response.data;
}

export function useReportsAnalyticsOverview(
  from: string,
  to: string,
  options: { userId?: string | null } = {},
) {
  const userId = options.userId ?? null;
  return useQuery({
    queryKey: reportsAnalyticsOverviewQueryKey(from, to, userId),
    queryFn: () => getReportsAnalyticsOverview(from, to, { userId }),
    enabled: Boolean(from && to && from <= to),
    staleTime: ANALYTICS_STALE_TIME,
    gcTime: ANALYTICS_GC_TIME,
    placeholderData: keepPreviousData,
  });
}
