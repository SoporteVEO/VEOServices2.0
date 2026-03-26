"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/primitives/ui/sidebar";
import { UserCard } from "@/components/ui/user-card";
import { NAV_GROUPS } from "@/lib/routes";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg text-left outline-none  focus-visible:ring-2 transition-all duration-200 will-change-transform"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            V
          </span>
          <span className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold tracking-tight">VEO</span>
            <span className="truncate text-xs text-muted-foreground">
              Services
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label || group.items[0]?.href}>
            {group.label ? (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-accent data-[active=false]:hover:text-accent-foreground"
                      tooltip={{
                        children: item.title,
                        side: "right",
                        align: "center",
                      }}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <UserCard name="Usuario" subtitle="VEO Services" verified />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
