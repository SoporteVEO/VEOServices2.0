import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { StaticBillboardCode } from "./static-billboard-codes.get";

export interface CreateStaticBillboardCodeInput {
  code: string;
}

export async function createStaticBillboardCode(
  input: CreateStaticBillboardCodeInput,
) {
  const response = await apiFetch<{ data: StaticBillboardCode }>(
    "/static-billboard-codes",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export function useCreateStaticBillboardCode(options?: {
  onSuccess?: (created: StaticBillboardCode) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaticBillboardCode,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: ["static-billboard-codes"],
      });
      options?.onSuccess?.(created);
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}
