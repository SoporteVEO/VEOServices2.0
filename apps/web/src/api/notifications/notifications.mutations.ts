import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Notification,
  UserNotificationStatus,
} from "./notifications.types";

export function useUpdateNotificationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: UserNotificationStatus;
    }) => {
      const { data } = await api.patch<{ data: Notification }>(
        `/notifications/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notifications", "active"] }),
  });
}

export function useMarkAllNotificationsViewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: { count: number } }>(
        "/notifications/mark-all-viewed",
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notifications", "active"] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ data: Notification }>(
        `/notifications/${id}`,
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notifications", "active"] }),
  });
}
