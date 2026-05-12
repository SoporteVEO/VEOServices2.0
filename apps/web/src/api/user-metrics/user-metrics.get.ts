import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { UserMetricsSummary } from "./user-metrics.types";

export const USER_METRICS_QUERY_KEY = ["me", "metrics"] as const;

export async function getMyMetricsSummary() {
  const response = await apiFetch<{ data: UserMetricsSummary }>(
    "/me/metrics/summary",
  );
  return response.data;
}

export function useMyMetricsSummary() {
  return useQuery({
    queryKey: USER_METRICS_QUERY_KEY,
    queryFn: getMyMetricsSummary,
  });
}
