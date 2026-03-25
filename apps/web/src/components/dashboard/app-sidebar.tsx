"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/primitives/ui/sidebar";

const nav = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/80 px-2 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none ring-sidebar-ring transition-[color,box-shadow] focus-visible:ring-2"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary font-(family-name:--font-heading) text-sm font-semibold text-sidebar-primary-foreground">
            V
          </span>
          <span className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold tracking-tight">Veo</span>
            <span className="truncate text-xs text-muted-foreground">
              Console
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
