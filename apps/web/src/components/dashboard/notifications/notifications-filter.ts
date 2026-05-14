import type { Notification } from "@/api/notifications/notifications.types";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterNotifications(
  notifications: Notification[],
  query: string,
): Notification[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return notifications;

  const tokens = normalize(trimmed).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return notifications;

  return notifications.filter((notification) => {
    const haystack = normalize(notification.description);
    return tokens.every((token) => haystack.includes(token));
  });
}
