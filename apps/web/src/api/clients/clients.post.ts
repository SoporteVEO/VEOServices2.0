import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Client, CreateClientInput } from "./clients.types";

export type { CreateClientInput } from "./clients.types";

export async function createClient(input: CreateClientInput): Promise<Client> {
  const response = await apiFetch<{ data: Client }>("/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export function useCreateClient(options?: {
  onSuccess?: (created: Client) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      options?.onSuccess?.(created);
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}
