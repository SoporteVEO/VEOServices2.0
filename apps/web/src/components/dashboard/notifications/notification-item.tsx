"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import type { Notification } from "@/api/notifications/notifications.types";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { cn } from "@/lib/utils";
import { FALLBACK_VISUAL, PRIORITY_VISUAL } from "./notification-icons";
import { getNotificationHref } from "./notification-href";
import { formatNotificationTime } from "./notification-time";

const VIEW_DELAY_MS = 350;

type NotificationItemProps = {
  notification: Notification;
  onView: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

export function NotificationItem({
  notification,
  onView,
  onOpen,
  onDelete,
}: NotificationItemProps) {
  const visual =
    PRIORITY_VISUAL[notification.priority] ?? FALLBACK_VISUAL;
  const isPending = notification.status === "PENDING";
  const href = getNotificationHref(notification);
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearHoverTimer = React.useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => () => clearHoverTimer(), [clearHoverTimer]);

  function handlePointerEnter() {
    if (!isPending) return;
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => {
      onView(notification.id);
      hoverTimerRef.current = null;
    }, VIEW_DELAY_MS);
  }

  function handlePointerLeave() {
    clearHoverTimer();
  }

  function handleFocus() {
    if (!isPending) return;
    onView(notification.id);
  }

  const content = (
    <>
      <div
        className={cn(
          "ms-2 flex size-9 shrink-0 items-center justify-center",
          visual.ringClass,
        )}
      >
        <visual.Icon className={cn("size-4", visual.iconClass)} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={cn(
            "text-sm leading-snug",
            isPending ? "font-medium text-foreground" : "text-foreground/85",
          )}
        >
          {notification.description}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatNotificationTime(notification.createdAt)}</span>
          <span aria-hidden>•</span>
          <span>Prioridad {visual.label.toLowerCase()}</span>
        </div>
      </div>
    </>
  );

  return (
    <div
      role="listitem"
      data-status={notification.status}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      tabIndex={href ? undefined : 0}
      className={cn(
        "group relative flex items-start gap-1 rounded-lg border border-transparent p-3 outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        isPending
          ? "bg-accent/40 hover:bg-accent/60"
          : "bg-transparent hover:bg-accent/30",
      )}
    >
      {isPending ? (
        <span
          aria-hidden
          className="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 bg-primary"
        />
      ) : null}
      {href ? (
        <Link
          href={href}
          onClick={() => onOpen(notification.id)}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {content}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3">{content}</div>
      )}
      <div className="flex shrink-0 items-center">
        {href ? (
          <ChevronRight
            aria-hidden
            className="size-4 text-muted-foreground transition-opacity group-hover:hidden group-focus-within:hidden"
          />
        ) : null}
        <PrimitiveButton
          variant="ghost"
          size="icon-xs"
          className={cn(
            "text-muted-foreground transition-opacity focus-visible:opacity-100",
            href
              ? "hidden group-hover:inline-flex group-focus-within:inline-flex"
              : "opacity-0 group-hover:opacity-100",
          )}
          aria-label="Eliminar notificación"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 />
        </PrimitiveButton>
      </div>
    </div>
  );
}
