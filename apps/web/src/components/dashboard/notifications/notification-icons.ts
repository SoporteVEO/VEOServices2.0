import { AlertCircle, AlertTriangle, BellRing, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NotificationPriority } from "@/api/notifications/notifications.types";

type PriorityVisual = {
  Icon: LucideIcon;
  iconClass: string;
  ringClass: string;
  label: string;
};

export const PRIORITY_VISUAL: Record<NotificationPriority, PriorityVisual> = {
  HIGH: {
    Icon: AlertTriangle,
    iconClass: "text-red-500 dark:text-red-400",
    ringClass: "bg-red-500/10",
    label: "Alta",
  },
  MEDIUM: {
    Icon: AlertCircle,
    iconClass: "text-orange-500 dark:text-orange-400",
    ringClass: "bg-orange-500/10",
    label: "Media",
  },
  LOW: {
    Icon: Info,
    iconClass: "text-blue-500 dark:text-blue-400",
    ringClass: "bg-blue-500/10",
    label: "Baja",
  },
};

export const FALLBACK_VISUAL: PriorityVisual = {
  Icon: BellRing,
  iconClass: "text-muted-foreground",
  ringClass: "bg-muted",
  label: "Notificación",
};
