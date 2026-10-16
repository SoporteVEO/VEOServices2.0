import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { banksKeys } from "./banks.get";
import type { BankMovementInput } from "./finance.types";

export type BankMovementKind = "deposits" | "charges";

const BASE = "/finance/banks";

export function useCreateBankMovement(kind: BankMovementKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BankMovementInput) =>
      apiFetch(`${BASE}/${kind}`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...banksKeys.all, kind] }),
  });
}

export function useDeleteBankMovement(kind: BankMovementKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${BASE}/${kind}/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...banksKeys.all, kind] }),
  });
}
