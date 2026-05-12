import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ActiveNotificationsResponse } from "./notifications.types";

const POLL_INTERVAL_MS = 30000;

export async function getActiveNotifications() {
  return apiFetch<ActiveNotificationsResponse>("/notifications");
}

export function useActiveNotifications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["notifications", "active"],
    queryFn: getActiveNotifications,
    enabled: options?.enabled ?? true,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}
