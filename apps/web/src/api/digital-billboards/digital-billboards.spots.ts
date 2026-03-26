import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface DigitalBillboardSpotUsage {
  id: string;
  timestamp: string;
  duration: number;
  campaignName: string | null;
  campaignDescription: string | null;
}

export async function getDigitalBillboardSpots({
  billboardId,
  from,
  to,
}: {
  billboardId: string;
  from: string;
  to: string;
}) {
  const response = await apiFetch<{ data: DigitalBillboardSpotUsage[] }>(
    `/digital-billboards/${billboardId}/spots`,
    {
      method: "GET",
      query: { from, to },
    },
  );
  return response.data;
}

export function useDigitalBillboardSpots({
  billboardId,
  from,
  to,
}: {
  billboardId: string;
  from: string;
  to: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["digital-billboards", billboardId, "spots", from, to],
    queryFn: () => getDigitalBillboardSpots({ billboardId, from, to }),
  });
  return { data, isLoading };
}

export interface CreateDigitalBillboardSpotInput {
  timestamp: string;
  duration: number;
  campaignName?: string | null;
  campaignDescription?: string | null;
}

export async function createDigitalBillboardSpot({
  billboardId,
  ...body
}: CreateDigitalBillboardSpotInput & { billboardId: string }) {
  return apiFetch(`/digital-billboards/${billboardId}/spots`, {
    method: "POST",
    body: JSON.stringify({
      timestamp: body.timestamp,
      duration: body.duration,
      campaignName: body.campaignName,
      campaignDescription: body.campaignDescription,
    }),
  });
}

export function useCreateDigitalBillboardSpot(options: {
  billboardId: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const { billboardId, onSuccess } = options;

  return useMutation({
    mutationFn: (input: CreateDigitalBillboardSpotInput) =>
      createDigitalBillboardSpot({ billboardId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["digital-billboards", billboardId, "spots"],
      });
      onSuccess?.();
    },
  });
}
