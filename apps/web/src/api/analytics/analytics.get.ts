import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { UserAppUsageReport } from "./analytics.types";

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
