import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ProcessRecuperacionesResult,
  RecuperacionRowPayload,
} from "./brilo-webapi.types";

export async function processRecuperaciones(
  rows: RecuperacionRowPayload[],
): Promise<ProcessRecuperacionesResult> {
  return apiFetch<ProcessRecuperacionesResult>("/brilo-webapi/recuperaciones", {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}

export function useProcessRecuperaciones(options?: {
  onSuccess?: (result: ProcessRecuperacionesResult) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: processRecuperaciones,
    onSuccess: options?.onSuccess,
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}
