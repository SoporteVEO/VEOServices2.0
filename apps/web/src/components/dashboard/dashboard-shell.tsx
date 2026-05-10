"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardAccessGuard } from "@/components/dashboard/dashboard-access-guard";
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
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 w-full">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-1 mt-3 h-6" />
          <span className="text-sm font-medium text-muted-foreground capitalize">
            {title}
          </span>
          <div className="flex flex-1 items-center justify-end gap-2">
            <ModeToggle />
          </div>
        </header>
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,oklch(0.72_0.17_45/0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,oklch(0.55_0.18_264/0.18),transparent_55%)]"
          />
          <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto p-4">
            <DashboardAccessGuard>{children}</DashboardAccessGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
