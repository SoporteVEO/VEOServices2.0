import { apiFetch } from "@/lib/api";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

export async function getPushPublicKey(): Promise<string | null> {
  const response = await apiFetch<{ data: { publicKey: string | null } }>(
    "/push/public-key",
  );
  return response.data.publicKey;
}

export async function savePushSubscription(input: PushSubscriptionInput) {
  await apiFetch<void>("/push/subscriptions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function removePushSubscription(endpoint: string) {
  await apiFetch<void>("/push/subscriptions", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });
}

export async function sendTestPush() {
  await apiFetch<void>("/push/test", { method: "POST" });
}
