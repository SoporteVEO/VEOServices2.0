import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  AdvanceInput,
  ClientPaymentInput,
  InvoicePaymentInput,
} from "./finance.types";
import { receivablesKeys } from "./receivables.get";

const BASE = "/finance/receivables";

function useReceivableMutation<TInput>(path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) =>
      apiFetch(`${BASE}/${path}`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: receivablesKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ["finance", "invoicing"],
      });
    },
  });
}

export function useCreateInvoicePayment() {
  return useReceivableMutation<InvoicePaymentInput>("invoice-payments");
}

export function useCreateClientPayment() {
  return useReceivableMutation<ClientPaymentInput>("client-payments");
}

export function useCreateAdvance() {
  return useReceivableMutation<AdvanceInput>("advances");
}
