import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { pantallasKeys } from "./pantallas.get";
import type {
  CampaignInput,
  IngestOrderInput,
  PantallasSettings,
  PlacementResult,
  ScreenInput,
} from "./pantallas.types";

function usePantallasMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pantallasKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["digital-billboards"] });
    },
  });
}

async function send<T>(path: string, method: string, body?: unknown) {
  const response = await apiFetch<{ data: T }>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return response.data;
}

export function useUpdatePantallasSettings() {
  return usePantallasMutation((input: Partial<PantallasSettings>) =>
    send<PantallasSettings>("/pantallas/settings", "PATCH", input),
  );
}

export function useCreateScreen() {
  return usePantallasMutation((input: ScreenInput) =>
    send<{ id: string }>("/pantallas/screens", "POST", input),
  );
}

export function useUpdateScreen() {
  return usePantallasMutation(
    ({ id, ...input }: { id: string } & Partial<ScreenInput>) =>
      send<{ id: string }>(`/pantallas/screens/${id}`, "PATCH", input),
  );
}

export function useCreateSublist() {
  return usePantallasMutation(
    ({ screenId, ...input }: { screenId: string; capacity: number; name?: string }) =>
      send<{ id: string }>(`/pantallas/screens/${screenId}/sublists`, "POST", input),
  );
}

export function useUpdateSublist() {
  return usePantallasMutation(
    ({ id, ...input }: { id: string; name?: string; capacity?: number }) =>
      send<{ id: string }>(`/pantallas/sublists/${id}`, "PATCH", input),
  );
}

export function useDeleteSublist() {
  return usePantallasMutation(({ id }: { id: string }) =>
    send<{ deleted: boolean }>(`/pantallas/sublists/${id}`, "DELETE"),
  );
}

export function useCreateCampaign() {
  return usePantallasMutation(
    ({ sublistId, ...input }: { sublistId: string } & CampaignInput) =>
      send<{ id: string; copies: PlacementResult[] }>(
        `/pantallas/sublists/${sublistId}/campaigns`,
        "POST",
        input,
      ),
  );
}

export function useUpdateCampaign() {
  return usePantallasMutation(
    ({ id, ...input }: { id: string; sublistId?: string } & CampaignInput) =>
      send<{ id: string; copies: PlacementResult[] }>(
        `/pantallas/campaigns/${id}`,
        "PATCH",
        input,
      ),
  );
}

export function useSetCampaignPause() {
  return usePantallasMutation(
    ({ id, ...input }: { id: string; paused: boolean; reason?: string }) =>
      send<{ id: string }>(`/pantallas/campaigns/${id}/pause`, "PATCH", input),
  );
}

export function useMoveCampaign() {
  return usePantallasMutation(
    ({ id, sublistId }: { id: string; sublistId: string }) =>
      send<{ id: string }>(`/pantallas/campaigns/${id}/move`, "PATCH", {
        sublistId,
      }),
  );
}

export function useDeleteCampaigns() {
  return usePantallasMutation(({ ids }: { ids: string[] }) =>
    send<{ deleted: number }>("/pantallas/campaigns/delete", "POST", { ids }),
  );
}

export function useIngestOrder() {
  return usePantallasMutation((input: IngestOrderInput) =>
    send<{ orderGroupId: string; results: PlacementResult[] }>(
      "/pantallas/orders",
      "POST",
      input,
    ),
  );
}

export function useClearPantallasLogs() {
  return usePantallasMutation(() =>
    send<{ deleted: number }>("/pantallas/logs", "DELETE"),
  );
}
