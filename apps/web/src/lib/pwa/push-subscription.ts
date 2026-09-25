import {
  getPushPublicKey,
  removePushSubscription,
  savePushSubscription,
  type PushSubscriptionInput,
} from "@/api/push/push.api";
import {
  getServiceWorkerRegistration,
  isPushSupported,
  urlBase64ToUint8Array,
} from "./browser";

export interface PushStatus {
  supported: boolean;
  /** False when the API has no VAPID keys, so there is nothing to subscribe to. */
  serverEnabled: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}

export const UNSUPPORTED_PUSH_STATUS: PushStatus = {
  supported: false,
  serverEnabled: false,
  permission: "default",
  subscribed: false,
};

function toSubscriptionInput(sub: PushSubscription): PushSubscriptionInput {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
    userAgent: navigator.userAgent.slice(0, 500),
  };
}

/**
 * Registers the service worker and reports where this device stands. An
 * existing subscription is re-sent so the server follows whoever is signed in
 * on the phone right now.
 */
export async function loadPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return UNSUPPORTED_PUSH_STATUS;

  const [registration, publicKey] = await Promise.all([
    getServiceWorkerRegistration(),
    getPushPublicKey().catch(() => null),
  ]);
  const subscription = await registration.pushManager.getSubscription();
  const permission = Notification.permission;

  if (subscription && permission === "granted" && publicKey) {
    await savePushSubscription(toSubscriptionInput(subscription)).catch(
      () => undefined,
    );
  }

  return {
    supported: true,
    serverEnabled: Boolean(publicKey),
    permission,
    subscribed: Boolean(subscription) && permission === "granted",
  };
}

/**
 * `permissionRequest` must come from `Notification.requestPermission()` called
 * synchronously inside the tap handler: iOS ignores the prompt otherwise.
 */
export async function subscribeDevice(
  permissionRequest: Promise<NotificationPermission>,
): Promise<PushStatus> {
  const permission = await permissionRequest;
  if (permission !== "granted") {
    return {
      supported: true,
      serverEnabled: true,
      permission,
      subscribed: false,
    };
  }

  const publicKey = await getPushPublicKey();
  if (!publicKey) {
    throw new Error("Las notificaciones no están configuradas en el servidor.");
  }

  const registration = await getServiceWorkerRegistration();
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await savePushSubscription(toSubscriptionInput(subscription));
  return { supported: true, serverEnabled: true, permission, subscribed: true };
}

/** Detaches this phone from the signed-in user; safe to call when unsupported. */
export async function unsubscribeDevice(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await removePushSubscription(subscription.endpoint).catch(() => undefined);
    await subscription.unsubscribe();
  } catch {
    // Sign-out must never be blocked by push cleanup.
  }
}
