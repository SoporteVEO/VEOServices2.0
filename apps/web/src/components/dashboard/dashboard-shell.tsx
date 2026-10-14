"use client";

import type { ReactNode } from "react";

import { ActivityTracker } from "@/components/dashboard/activity-tracker";
import {
  AgentPanel,
  AgentPanelProvider,
  AgentPanelTrigger,
} from "@/components/dashboard/agent";
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
    <AgentPanelProvider>
      <SidebarProvider>
        <ActivityTracker />
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-hidden">
          <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center gap-3 border-b border-border bg-card px-3 md:px-4">
            <SidebarTrigger className="-ms-1 text-muted-foreground hover:text-foreground" />
            <div className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="size-1.5 shrink-0 bg-veo-lime" />
              <span className="truncate font-heading text-[0.9375rem] font-semibold capitalize tracking-[-0.01em] text-foreground">
                {title}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-end gap-1.5">
              <NotificationsButton />
              <ModeToggle />
              <Separator orientation="vertical" className="mx-1 h-5" />
              <AgentPanelTrigger />
            </div>
          </header>
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="@container/main flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto bg-background">
              <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col p-3 @3xl/main:p-5 @7xl/main:p-6">
                <DashboardAccessGuard>{children}</DashboardAccessGuard>
              </div>
            </div>
          </div>
        </SidebarInset>
        <AgentPanel />
      </SidebarProvider>
    </AgentPanelProvider>
  );
}
