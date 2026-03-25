"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/primitives/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/primitives/ui/sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/60">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-1 h-6" />
          <div className="flex flex-1 items-center justify-end gap-2">
            <ModeToggle />
          </div>
        </header>
        <div className="relative flex flex-1 flex-col">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,oklch(0.72_0.17_45/0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,oklch(0.55_0.18_264/0.18),transparent_55%)]"
          />
          <div className="relative flex flex-1 flex-col">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
