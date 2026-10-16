import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  PrintRescheduleQueueItem,
  PrintRescheduleRequest,
} from "@/api/production-orders/production-orders.types";
import { printRescheduleRequestsKeys } from "./print-reschedule-requests.get";

const PRODUCTION_ORDERS_KEY = ["production-orders"] as const;

export interface CreatePrintRescheduleRequestInput {
  productionOrderItemId: string;
  reason: string;
  isUrgent?: boolean;
  /** Midday instant of the day the requester would like it printed. */
  preferredDate?: string;
}

export async function createPrintRescheduleRequest(
  input: CreatePrintRescheduleRequestInput,
): Promise<PrintRescheduleRequest> {
  const response = await apiFetch<{ data: PrintRescheduleRequest }>(
    "/print-reschedule-requests",
    { method: "POST", body: JSON.stringify(input) },
  );
  return response.data;
}

export async function cancelPrintRescheduleRequest(
  requestId: string,
): Promise<PrintRescheduleRequest> {
  const response = await apiFetch<{ data: PrintRescheduleRequest }>(
    `/print-reschedule-requests/${requestId}/cancel`,
    { method: "PATCH" },
  );
  return response.data;
}

export interface ResolvePrintRescheduleRequestInput {
  requestId: string;
  status: "RESOLVED" | "REJECTED";
  resolutionNote?: string;
}

export async function resolvePrintRescheduleRequest({
  requestId,
  ...body
}: ResolvePrintRescheduleRequestInput): Promise<PrintRescheduleQueueItem> {
  const response = await apiFetch<{ data: PrintRescheduleQueueItem }>(
    `/print-reschedule-requests/${requestId}/resolve`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return response.data;
}

function useInvalidateRescheduleData() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDERS_KEY });
    void queryClient.invalidateQueries({
      queryKey: printRescheduleRequestsKeys.all,
    });
  };
}

export function useCreatePrintRescheduleRequest() {
  const invalidate = useInvalidateRescheduleData();
  return useMutation({
    mutationFn: createPrintRescheduleRequest,
    onSuccess: invalidate,
  });
}

export function useCancelPrintRescheduleRequest() {
  const invalidate = useInvalidateRescheduleData();
  return useMutation({
    mutationFn: cancelPrintRescheduleRequest,
    onSuccess: invalidate,
  });
}

export function useResolvePrintRescheduleRequest() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateRescheduleData();
  return useMutation({
    mutationFn: resolvePrintRescheduleRequest,
    onSuccess: (resolved) => {
      queryClient.setQueryData<PrintRescheduleQueueItem[]>(
        printRescheduleRequestsKeys.pending(),
        (old) => old?.filter((request) => request.id !== resolved.id),
      );
      invalidate();
    },
  });
}
