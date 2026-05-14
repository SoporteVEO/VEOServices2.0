"use client";

import * as React from "react";
import { Bell, BellOff, CheckCheck, Loader2, SearchX } from "lucide-react";
import type { Notification } from "@/api/notifications/notifications.types";
import { useActiveNotifications } from "@/api/notifications/notifications.get";
import {
  useDeleteNotification,
  useMarkAllNotificationsViewed,
  useUpdateNotificationStatus,
} from "@/api/notifications/notifications.mutations";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/ui/popover";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Separator } from "@/components/primitives/ui/separator";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./notification-item";
import { NotificationsSearch } from "./notifications-search";
import { filterNotifications } from "./notifications-filter";

const MAX_BADGE_COUNT = 9;

type NotificationsButtonProps = {
  className?: string;
};

export function NotificationsButton({ className }: NotificationsButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data, isLoading, isError, refetch, isFetching } =
    useActiveNotifications();
  const updateStatusMutation = useUpdateNotificationStatus();
  const markAllViewedMutation = useMarkAllNotificationsViewed();
  const deleteMutation = useDeleteNotification();

  const notifications = data?.data ?? [];
  const pendingCount = data?.pendingCount ?? 0;
  const hasPending = pendingCount > 0;
  const hasNotifications = notifications.length > 0;

  const filteredNotifications = React.useMemo(
    () => filterNotifications(notifications, searchQuery),
    [notifications, searchQuery],
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setSearchQuery("");
  }

  function handleViewNotification(id: string) {
    const notification = notifications.find((n) => n.id === id);
    if (!notification || notification.status !== "PENDING") return;
    updateStatusMutation.mutate({ id, status: "VIEWED" });
  }

  function handleDeleteNotification(id: string) {
    deleteMutation.mutate(id);
  }

  function handleMarkAll() {
    if (!hasPending || markAllViewedMutation.isPending) return;
    markAllViewedMutation.mutate();
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative size-9 shrink-0", className)}
          aria-label={
            hasPending
              ? `Notificaciones (${pendingCount} sin leer)`
              : "Notificaciones"
          }
        >
          <Bell className="size-4" />
          {hasPending ? (
            <span
              aria-hidden
              className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-background"
            >
              {pendingCount > MAX_BADGE_COUNT
                ? `${MAX_BADGE_COUNT}+`
                : pendingCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[22rem] p-0 sm:w-[24rem]"
      >
        <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
          <h3 className="min-w-0 truncate text-sm font-semibold leading-none">
            Notificaciones
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            disabled={!hasPending || markAllViewedMutation.isPending}
            data-icon="inline-start"
            className="gap-1.5"
          >
            {markAllViewedMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            <span>Marcar todas</span>
          </Button>
        </div>
        {hasNotifications ? (
          <div className="px-3 pb-3">
            <NotificationsSearch
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        ) : null}
        <Separator />
        <NotificationsList
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          notifications={filteredNotifications}
          hasUnfilteredNotifications={hasNotifications}
          searchQuery={searchQuery.trim()}
          onView={handleViewNotification}
          onDelete={handleDeleteNotification}
          onClearSearch={() => setSearchQuery("")}
          onRetry={() => refetch()}
        />
      </PopoverContent>
    </Popover>
  );
}

type NotificationsListProps = {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  notifications: Notification[];
  hasUnfilteredNotifications: boolean;
  searchQuery: string;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onClearSearch: () => void;
  onRetry: () => void;
};

function NotificationsList({
  isLoading,
  isError,
  notifications,
  hasUnfilteredNotifications,
  searchQuery,
  onView,
  onDelete,
  onClearSearch,
  onRetry,
}: NotificationsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Cargando notificaciones...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <BellOff className="size-6 text-destructive" />
        <p className="text-sm text-foreground">
          No pudimos cargar tus notificaciones
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (notifications.length === 0) {
    if (hasUnfilteredNotifications && searchQuery.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <SearchX className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Sin coincidencias</p>
            <p className="text-xs text-muted-foreground">
              No encontramos notificaciones que coincidan con &quot;
              {searchQuery}&quot;.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClearSearch}>
            Limpiar búsqueda
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Bell className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No tienes notificaciones</p>
        <p className="text-xs text-muted-foreground">
          Te avisaremos cuando algo importante ocurra.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[26rem] overflow-y-auto">
      <div role="list" className="flex flex-col gap-1 p-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onView={onView}
            onDelete={onDelete}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
