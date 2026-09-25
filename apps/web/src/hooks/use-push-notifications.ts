"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendTestPush } from "@/api/push/push.api";
import { isPushSupported } from "@/lib/pwa/browser";
import {
  loadPushStatus,
  subscribeDevice,
  type PushStatus,
} from "@/lib/pwa/push-subscription";

export const PUSH_STATUS_QUERY_KEY = ["push", "status"] as const;

export function usePushNotifications() {
  const queryClient = useQueryClient();

  const status = useQuery({
    queryKey: PUSH_STATUS_QUERY_KEY,
    queryFn: loadPushStatus,
    staleTime: Infinity,
    retry: false,
  });

  const enable = useMutation({
    mutationFn: subscribeDevice,
    onSuccess: (next: PushStatus) => {
      queryClient.setQueryData(PUSH_STATUS_QUERY_KEY, next);
      if (next.subscribed) void sendTestPush().catch(() => undefined);
    },
  });

  function requestEnable() {
    if (!isPushSupported()) return;
    // Called straight from the tap so iOS still treats it as a user gesture.
    enable.mutate(Notification.requestPermission());
  }

  return {
    status: status.data,
    isLoading: status.isPending,
    requestEnable,
    isEnabling: enable.isPending,
    enableError: enable.error,
  };
}
