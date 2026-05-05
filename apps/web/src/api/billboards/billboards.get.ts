import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, apiFetch } from "@/lib/api";
import type {
  AvailableBillboard,
  AvailableBillboardListing,
  AvailableBillboardReport,
  AvailableState,
  BillboardContractHistoryItem,
  BillboardDashboardAnalytics,
} from "./billboards.types";

export type {
  AvailableBillboard,
  AvailableBillboardListing,
  AvailableBillboardReport,
  AvailableState,
  BillboardContractHistoryItem,
  BillboardDashboardAnalytics,
  DashboardKpis,
  DashboardMonthlyTrend,
  DashboardYoyTrend,
  DashboardTopCustomer,
  DashboardTopBillboard,
  DashboardDepartmentBreakdown,
} from "./billboards.types";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

export function getBillboardImageUrl(
  imageId: number | null | undefined,
): string | null {
  if (imageId == null) return null;
  const base = (api.defaults.baseURL ?? "").replace(/\/$/, "");
  return `${base}/billboards/image/${imageId}`;
}

export async function getBillboardStates(params: { from: string; to: string }) {
  const response = await apiFetch<{ data: AvailableState[] }>(
    "/billboards/states",
    { query: { from: params.from, to: params.to } },
  );
  return response.data;
}

export function useBillboardStates(params: {
  from: string;
  to: string;
  enabled?: boolean;
}) {
  const { from, to, enabled = true } = params;
  return useQuery({
    queryKey: ["billboards", "states", from, to],
    queryFn: () => getBillboardStates({ from, to }),
    enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getAvailableBillboards(params: {
  departmentId: number;
  from: string;
  to: string;
}) {
  const response = await apiFetch<{ data: AvailableBillboard[] }>(
    "/billboards",
    {
      query: {
        departmentId: String(params.departmentId),
        from: params.from,
        to: params.to,
      },
    },
  );
  return response.data;
}

export function useAvailableBillboards(params: {
  departmentId: number | null;
  from: string;
  to: string;
  enabled?: boolean;
}) {
  const { departmentId, from, to, enabled = true } = params;
  return useQuery({
    queryKey: ["billboards", departmentId, from, to],
    queryFn: () =>
      getAvailableBillboards({
        departmentId: departmentId!,
        from,
        to,
      }),
    enabled: enabled && departmentId != null,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getAvailableBillboardsInRange(params: {
  from: string;
  to: string;
  includeUnavailable?: boolean;
}) {
  const query: Record<string, string> = {
    from: params.from,
    to: params.to,
  };
  if (params.includeUnavailable) {
    query.includeUnavailable = "true";
  }
  const response = await apiFetch<{ data: AvailableBillboardListing[] }>(
    "/billboards/available",
    { query },
  );
  return response.data;
}

export function useAvailableBillboardsInRange(params: {
  from: string;
  to: string;
  includeUnavailable?: boolean;
  enabled?: boolean;
}) {
  const { from, to, includeUnavailable = false, enabled = true } = params;
  return useQuery({
    queryKey: ["billboards", "available", from, to, includeUnavailable],
    queryFn: () =>
      getAvailableBillboardsInRange({ from, to, includeUnavailable }),
    enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getAvailableBillboardsForReport(params: {
  from: string;
  to: string;
}) {
  const response = await apiFetch<{ data: AvailableBillboardReport[] }>(
    "/billboards/available/report",
    { query: { from: params.from, to: params.to } },
  );
  return response.data;
}

export async function getBillboardContractHistory(billboardId: number) {
  const response = await apiFetch<{ data: BillboardContractHistoryItem[] }>(
    `/billboards/${billboardId}/contracts`,
  );
  return response.data;
}

export function useBillboardContractHistory(params: {
  billboardId: number | null;
  enabled?: boolean;
}) {
  const { billboardId, enabled = true } = params;
  return useQuery({
    queryKey: ["billboards", "contracts", billboardId],
    queryFn: () => getBillboardContractHistory(billboardId!),
    enabled: enabled && billboardId != null,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export async function getBillboardDashboardAnalytics(params: {
  from: string;
  to: string;
}) {
  const response = await apiFetch<{ data: BillboardDashboardAnalytics }>(
    "/billboards/dashboard/analytics",
    { query: { from: params.from, to: params.to } },
  );
  return response.data;
}

export function useBillboardDashboardAnalytics(params: {
  from: string;
  to: string;
  enabled?: boolean;
}) {
  const { from, to, enabled = true } = params;
  return useQuery({
    queryKey: ["billboards", "dashboard", "analytics", from, to],
    queryFn: () => getBillboardDashboardAnalytics({ from, to }),
    enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}
