import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { accountingKeys } from "./accounting.get";
import type {
  CreateEntryInput,
  EntryLineInput,
  Partida,
} from "./finance.types";

const BASE = "/finance/accounting";

export function useCreateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEntryInput) => {
      const response = await apiFetch<{ data: Partida }>(`${BASE}/entries`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountingKeys.all }),
  });
}

/** Lines are always re-read after a change so Brilo's totals stay authoritative. */
function useEntryLineMutation<TInput>(
  request: (input: TInput) => Promise<unknown>,
  mpaIdOf: (input: TInput) => number,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (_data, input) =>
      queryClient.invalidateQueries({
        queryKey: accountingKeys.entry(mpaIdOf(input)),
      }),
  });
}

export function useAddEntryLine() {
  return useEntryLineMutation(
    (input: { mpaId: number; line: EntryLineInput }) =>
      apiFetch(`${BASE}/entries/${input.mpaId}/lines`, {
        method: "POST",
        body: JSON.stringify(input.line),
      }),
    (input) => input.mpaId,
  );
}

export function useUpdateEntryLine() {
  return useEntryLineMutation(
    (input: { mpaId: number; dpaId: number; line: EntryLineInput }) =>
      apiFetch(`${BASE}/entries/${input.mpaId}/lines/${input.dpaId}`, {
        method: "PUT",
        body: JSON.stringify(input.line),
      }),
    (input) => input.mpaId,
  );
}

export function useDeleteEntryLine() {
  return useEntryLineMutation(
    (input: { mpaId: number; dpaId: number }) =>
      apiFetch(`${BASE}/entries/${input.mpaId}/lines/${input.dpaId}`, {
        method: "DELETE",
      }),
    (input) => input.mpaId,
  );
}
