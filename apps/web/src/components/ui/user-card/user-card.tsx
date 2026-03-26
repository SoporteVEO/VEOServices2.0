"use client";

import * as React from "react";
import { BadgeCheckIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const CLOSE_DELAY_MS = 200;

export type UserCardProps = {
  name: string;
  subtitle?: string;
  imageUrl?: string | null;
  fallback?: string;
  verified?: boolean;
  className?: string;
  onProfile?: () => void;
  onSignOut?: () => void;
};

export function UserCard({
  name,
  subtitle,
  imageUrl,
  fallback: fallbackProp,
  verified,
  className,
  onProfile,
  onSignOut,
}: UserCardProps) {
  const [open, setOpen] = React.useState(false);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const handleOpen = React.useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  React.useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const fallback =
    fallbackProp ??
    name
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={name}
          className={cn(
            "flex w-full min-w-0 items-start gap-3 rounded-lg px-2 py-1.5 text-left text-sidebar-foreground outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[state=open]:bg-sidebar-accent/80",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0",
            className,
          )}
          onPointerEnter={handleOpen}
          onPointerLeave={scheduleClose}
        >
          <Avatar className="size-9 shrink-0">
            {imageUrl ? <AvatarImage alt="" src={imageUrl} /> : null}
            <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 leading-none group-data-[collapsible=icon]:hidden">
            <span className="flex items-center gap-1 font-semibold tracking-tight">
              <span className="truncate">{name}</span>
              {verified ? (
                <BadgeCheckIcon
                  className="size-4 shrink-0 fill-blue-500 text-white"
                  aria-hidden
                />
              ) : null}
            </span>
            {subtitle ? (
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {subtitle}
              </span>
            ) : null}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="end"
        sideOffset={8}
        className="min-w-44"
        onPointerEnter={clearCloseTimer}
        onPointerLeave={scheduleClose}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="font-normal">
          <span className="font-medium">{name}</span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            onProfile?.();
          }}
        >
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            onSignOut?.();
          }}
        >
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
