"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PUSH_STATUS_QUERY_KEY } from "@/hooks/use-push-notifications";
import { unsubscribeDevice } from "@/lib/pwa/push-subscription";
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
import { BrandLogo } from "@/components/ui/brand-logo";
import { UserCard } from "@/components/ui/user-card";
import { AppSidebarSubmenu } from "./app-sidebar-submenu";
import { AppSidebarVersion } from "./app-sidebar-version";
import {
  NAV_GROUPS,
  filterNavGroupsByAccess,
  type NavGroup,
} from "@/lib/routes";
import {
  isPortalOnlyRole,
  type SubRole,
  type UserRole,
} from "@/api/users/users.types";
import { authClient, clearAuthToken } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  FIELD_PORTAL_BASE,
  FIELD_PORTAL_ICON,
  FIELD_PORTAL_LABEL,
} from "@/lib/portal-access";

/**
 * A portal-only role reaches the dashboard for a module or two and needs the
 * way back; every other role has no portal to return to.
 */
function portalGroupsFor(role?: UserRole): NavGroup[] {
  if (!isPortalOnlyRole(role)) return [];
  return [
    {
      label: "Portal",
      items: [
        {
          title: FIELD_PORTAL_LABEL,
          href: FIELD_PORTAL_BASE,
          icon: FIELD_PORTAL_ICON,
        },
      ],
    },
  ];
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const userName = session?.user?.name ?? "Usuario";
  const userEmail = session?.user?.email ?? "VEO Services";
  const sessionUser = session?.user as Record<string, unknown> | undefined;
  const userRole = sessionUser?.role as UserRole | undefined;
  const userSubRoles = (sessionUser?.subRoles as SubRole[] | undefined) ?? [];
  const visibleGroups = [
    ...portalGroupsFor(userRole),
    ...filterNavGroupsByAccess(NAV_GROUPS, userRole, userSubRoles),
  ];

  async function handleSignOut() {
    await unsubscribeDevice();
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          clearAuthToken();
          queryClient.removeQueries({ queryKey: PUSH_STATUS_QUERY_KEY });
          router.push("/");
        },
      },
    });
  }

  function handleProfile() {
    router.push("/dashboard/me");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-2">
        <Link
          href="/dashboard"
          aria-label="VEO Services"
          className="flex h-9 items-center gap-2.5 px-1.5 text-left outline-none ring-sidebar-ring focus-visible:ring-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <BrandLogo
            variant="isotipo"
            priority
            className="hidden group-data-[collapsible=icon]:block"
          />
          <BrandLogo
            priority
            onDark
            className="h-5 group-data-[collapsible=icon]:hidden"
          />
          <span className="pt-1 text-xs font-medium text-sidebar-muted-foreground group-data-[collapsible=icon]:hidden">
            Services
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-2">
        {visibleGroups.map((group, index) => (
          <SidebarGroup
            key={group.label || group.items[0]?.href}
            className={cn(
              "py-1.5",
              index === visibleGroups.length - 1 && "mt-auto",
            )}
          >
            {group.label ? (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu className="flex flex-col gap-0.5">
                {group.items.map((item) =>
                  item.children ? (
                    <AppSidebarSubmenu
                      key={item.href}
                      item={{ ...item, children: item.children }}
                      pathname={pathname}
                    />
                  ) : (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={{
                          children: item.title,
                          side: "right",
                          align: "center",
                        }}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <AppSidebarVersion />
        <UserCard
          name={userName}
          subtitle={userEmail}
          imageUrl={session?.user?.image}
          verified={session?.user?.emailVerified}
          onProfile={handleProfile}
          onSignOut={handleSignOut}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
