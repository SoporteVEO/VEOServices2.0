import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}
