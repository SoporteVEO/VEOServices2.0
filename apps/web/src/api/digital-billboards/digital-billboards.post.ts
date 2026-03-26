import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface DigitalBillboardInput {
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  maxSpots: number;
  imageBase64?: string | null;
}

export async function createDigitalBillboard(data: DigitalBillboardInput) {
  return apiFetch("/digital-billboards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function useDigitalBillboard(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDigitalBillboard,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["digital-billboards"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}
