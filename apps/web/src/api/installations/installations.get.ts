import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  InstallationTask,
  InstallationTaskListItem,
} from "./installations.types";

const STALE_TIME = 30 * 1000;

export const installationTaskKeys = {
  mine: ["installations", "mine"] as const,
  detail: (itemId: string | null) =>
    ["installations", "detail", itemId] as const,
};

export async function getMyInstallationTasks(): Promise<
  InstallationTaskListItem[]
> {
  const response = await apiFetch<{ data: InstallationTaskListItem[] }>(
    "/installations/mine",
  );
  return response.data;
}

export function useMyInstallationTasks() {
  return useQuery({
    queryKey: installationTaskKeys.mine,
    queryFn: getMyInstallationTasks,
    staleTime: STALE_TIME,
  });
}

export async function getInstallationTask(
  itemId: string,
): Promise<InstallationTask> {
  const response = await apiFetch<{ data: InstallationTask }>(
    `/installations/${itemId}`,
  );
  return response.data;
}

export function useInstallationTask(itemId: string | null) {
  return useQuery({
    queryKey: installationTaskKeys.detail(itemId),
    queryFn: () => getInstallationTask(itemId as string),
    enabled: !!itemId,
    staleTime: STALE_TIME,
  });
}
