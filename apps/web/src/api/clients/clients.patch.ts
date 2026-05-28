import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Client, UpdateClientInput } from "./clients.types";

export type { UpdateClientInput } from "./clients.types";

export async function updateClient(
  id: string,
  input: UpdateClientInput,
): Promise<Client> {
  const response = await apiFetch<{ data: Client }>(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data;
}

export function useUpdateClient(options?: {
  onSuccess?: (updated: Client) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClientInput }) =>
      updateClient(id, input),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.setQueryData(["clients", updated.id], updated);
      options?.onSuccess?.(updated);
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}
