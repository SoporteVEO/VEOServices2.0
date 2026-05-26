import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { OfferDetail, OfferListItem, UpdateOfferInput } from "./offers.types";

export async function updateOffer(
  id: string,
  input: UpdateOfferInput,
): Promise<OfferDetail> {
  const response = await apiFetch<{ data: OfferDetail }>(`/offers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data;
}

export function useUpdateOffer(options?: {
  onSuccess?: (updated: OfferDetail) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOfferInput }) =>
      updateOffer(id, input),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.setQueryData(["offers", updated.id], updated);
      options?.onSuccess?.(updated);
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}

export async function declineOffer(id: string): Promise<OfferListItem> {
  const response = await apiFetch<{ data: OfferListItem }>(
    `/offers/${id}/decline`,
    { method: "PATCH" },
  );
  return response.data;
}

export async function acceptOffer(
  id: string,
  briloMconId: number,
): Promise<OfferListItem> {
  const response = await apiFetch<{ data: OfferListItem }>(
    `/offers/${id}/accept`,
    {
      method: "PATCH",
      body: JSON.stringify({ briloMconId }),
    },
  );
  return response.data;
}

export function useDeclineOffer(options?: {
  onSuccess?: (updated: OfferListItem) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineOffer,
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

export function useAcceptOffer(options?: {
  onSuccess?: (updated: OfferListItem) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      briloMconId,
    }: {
      id: string;
      briloMconId: number;
    }) => acceptOffer(id, briloMconId),
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
