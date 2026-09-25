"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PUSH_STATUS_QUERY_KEY } from "@/hooks/use-push-notifications";
import { authClient, clearAuthToken } from "@/lib/auth-client";
import { unsubscribeDevice } from "@/lib/pwa/push-subscription";

/** Field phones are often shared, so signing out also stops this device's pushes. */
export function usePortalSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async function signOut() {
    await unsubscribeDevice();
    await authClient.signOut();
    clearAuthToken();
    queryClient.removeQueries({ queryKey: PUSH_STATUS_QUERY_KEY });
    router.replace("/");
  };
}
