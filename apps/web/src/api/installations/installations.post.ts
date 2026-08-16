import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { installationTaskKeys } from "./installations.get";
import type { InstallationTask } from "./installations.types";

async function postImage(
  path: string,
  imageBase64: string,
): Promise<InstallationTask> {
  const response = await apiFetch<{ data: InstallationTask }>(path, {
    method: "POST",
    body: JSON.stringify({ imageBase64 }),
  });
  return response.data;
}

export function useUploadVulcanizadoImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; imageBase64: string }) =>
      postImage(
        `/installations/${input.itemId}/vulcanizado-image`,
        input.imageBase64,
      ),
    onSuccess: (task) => syncTaskCaches(queryClient, task),
  });
}

export function useDeleteVulcanizadoImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { itemId: string }) => {
      const response = await apiFetch<{ data: InstallationTask }>(
        `/installations/${input.itemId}/vulcanizado-image`,
        { method: "DELETE" },
      );
      return response.data;
    },
    onSuccess: (task) => syncTaskCaches(queryClient, task),
  });
}

export function useUploadInstallationImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; imageBase64: string }) =>
      postImage(
        `/installations/${input.itemId}/installation-image`,
        input.imageBase64,
      ),
    onSuccess: (task) => syncTaskCaches(queryClient, task),
  });
}

/**
 * Every mutation returns the refreshed task, so we seed the detail cache and
 * only invalidate the lists that summarise it.
 */
function syncTaskCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  task: InstallationTask,
) {
  queryClient.setQueryData(installationTaskKeys.detail(task.id), task);
  void queryClient.invalidateQueries({ queryKey: installationTaskKeys.mine });
  void queryClient.invalidateQueries({ queryKey: ["production-orders"] });
  void queryClient.invalidateQueries({ queryKey: ["s3-images"] });
}
