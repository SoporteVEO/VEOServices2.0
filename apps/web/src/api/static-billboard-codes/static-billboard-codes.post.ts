import { isAxiosError } from "axios";
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

function toClientError(err: unknown, fallback: string): Error {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined;
    const raw = data?.message ?? data?.error;
    const message = Array.isArray(raw) ? raw.join(". ") : raw;
    if (message) return new Error(message);
  }
  if (err instanceof Error) return err;
  return new Error(fallback);
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
      options?.onError?.(toClientError(err, "No se pudo crear el código."));
    },
  });
}
