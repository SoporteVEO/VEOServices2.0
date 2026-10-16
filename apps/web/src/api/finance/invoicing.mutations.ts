import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SendOrderEmailInput } from "./finance.types";
import { invoicingKeys } from "./invoicing.get";

const BASE = "/finance/invoicing";

export function useFinalizeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mfaId: number) =>
      apiFetch(`${BASE}/orders/${mfaId}/finalize`, { method: "PUT" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: invoicingKeys.all }),
  });
}

export function useSendOrderEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { mfaId: number } & SendOrderEmailInput) => {
      const { mfaId, ...body } = input;
      return apiFetch(`${BASE}/orders/${mfaId}/emails`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (_data, input) =>
      queryClient.invalidateQueries({
        queryKey: invoicingKeys.orderEmails(input.mfaId),
      }),
  });
}
