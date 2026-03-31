"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { NAV_GROUPS, type NavGroup } from "@/lib/routes";
import { authClient, clearAuthToken } from "@/lib/auth-client";

function filterNavByRole(groups: NavGroup[], role?: string): NavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.requiredRole || i.requiredRole === role),
    }))
    .filter((g) => g.items.length > 0);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const userName = session?.user?.name ?? "Usuario";
  const userEmail = session?.user?.email ?? "VEO Services";
  const userRole = (session?.user as Record<string, unknown> | undefined)
    ?.role as string | undefined;
  const visibleGroups = filterNavByRole(NAV_GROUPS, userRole);

  function handleSignOut() {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          clearAuthToken();
          router.push("/");
        },
      },
    });
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2 transition-all duration-200 will-change-transform"
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
        {visibleGroups.map((group) => (
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
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
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
        <UserCard
          name={userName}
          subtitle={userEmail}
          imageUrl={session?.user?.image}
          verified={session?.user?.emailVerified}
          onSignOut={handleSignOut}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
