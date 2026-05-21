import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  AttachOfferPdfInput,
  CreateOfferInput,
  OfferListItem,
} from "./offers.types";

export type { AttachOfferPdfInput, CreateOfferInput } from "./offers.types";

export async function createOffer(
  input: CreateOfferInput,
): Promise<OfferListItem> {
  const response = await apiFetch<{ data: OfferListItem }>("/offers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export function useCreateOffer(options?: {
  onSuccess?: (created: OfferListItem) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOffer,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      options?.onSuccess?.(created);
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}

export async function attachOfferPdf(
  id: string,
  input: AttachOfferPdfInput,
): Promise<OfferListItem> {
  const response = await apiFetch<{ data: OfferListItem }>(
    `/offers/${id}/pdf`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  return response.data;
}

export function useAttachOfferPdf(options?: {
  onSuccess?: (updated: OfferListItem) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: AttachOfferPdfInput & { id: string }) =>
      attachOfferPdf(id, input),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      options?.onSuccess?.(updated);
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}
