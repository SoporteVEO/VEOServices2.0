import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
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

export const mySalesByCostCenterQueryKey = (from: string, to: string) =>
  ["analytics", "sales-by-cost-center", "mine", from, to] as const;

export async function getMySalesByCostCenterReport(from: string, to: string) {
  const response = await apiFetch<{ data: SalesByCostCenterReport }>(
    "/analytics/sales-by-cost-center/mine",
    { query: { from, to } },
  );
  return response.data;
}

export function useMySalesByCostCenterReport(from: string, to: string) {
  return useQuery({
    queryKey: mySalesByCostCenterQueryKey(from, to),
    queryFn: () => getMySalesByCostCenterReport(from, to),
    enabled: Boolean(from && to && from <= to),
  });
}
