import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { PrintRescheduleQueueItem } from "@/api/production-orders/production-orders.types";

export const printRescheduleRequestsKeys = {
  all: ["print-reschedule-requests"] as const,
  pending: () => ["print-reschedule-requests", "pending"] as const,
};

export async function getPendingPrintRescheduleRequests(): Promise<
  PrintRescheduleQueueItem[]
> {
  const response = await apiFetch<{ data: PrintRescheduleQueueItem[] }>(
    "/print-reschedule-requests",
  );
  return response.data;
}

export function usePendingPrintRescheduleRequests(enabled = true) {
  return useQuery({
    queryKey: printRescheduleRequestsKeys.pending(),
    queryFn: getPendingPrintRescheduleRequests,
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}
