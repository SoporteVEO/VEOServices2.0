import type { Notification } from "@/api/notifications/notifications.types";

/** Only in-app paths are followed; anything else renders as plain text. */
export function getNotificationHref(
  notification: Pick<Notification, "href">,
): string | null {
  const { href } = notification;
  if (!href || !href.startsWith("/") || href.startsWith("//")) return null;
  return href;
}
