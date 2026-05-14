"use client";

import type { ReactNode } from "react";

import { ActivityTracker } from "@/components/dashboard/activity-tracker";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardAccessGuard } from "@/components/dashboard/dashboard-access-guard";
import { NotificationsButton } from "@/components/dashboard/notifications";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/primitives/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/primitives/ui/sidebar";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/routes";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title =
    NAV_ITEMS.find((item) => item.href === pathname)?.title ??
    pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ??
    "Dashboard";

  return (
    <SidebarProvider>
      <ActivityTracker />
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 w-full">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-1 mt-3 h-6" />
          <span className="text-sm font-medium text-muted-foreground capitalize">
            {title}
          </span>
          <div className="flex flex-1 items-center justify-end gap-2">
            <NotificationsButton />
            <ModeToggle />
          </div>
        </header>
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto p-3 bg-background">
            <DashboardAccessGuard>{children}</DashboardAccessGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
