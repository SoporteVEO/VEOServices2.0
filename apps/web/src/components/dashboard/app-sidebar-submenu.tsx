"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/primitives/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/primitives/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/primitives/ui/sidebar";
import { isUnderPath, type NavItem } from "@/lib/routes";

type Props = {
  item: NavItem & { children: NavItem[] };
  pathname: string;
};

/**
 * A nav entry that groups related modules. The inline submenu is hidden when
 * the sidebar collapses to icons, so in that state it opens as a dropdown.
 */
export function AppSidebarSubmenu({ item, pathname }: Props) {
  const { state, isMobile } = useSidebar();
  const activeChild = item.children.find((child) => pathname === child.href);
  const isActive = !!activeChild;

  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              isActive={isActive}
              tooltip={{ children: item.title, side: "right", align: "center" }}
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
              {item.children.map((child) => (
                <DropdownMenuItem key={child.href} asChild>
                  <Link href={child.href}>
                    <child.icon />
                    {child.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      asChild
      defaultOpen={isUnderPath(pathname, item.href)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={false}
            className={activeChild ? "text-sidebar-foreground" : undefined}
            tooltip={{ children: item.title, side: "right", align: "center" }}
          >
            <item.icon />
            <span>{item.title}</span>
            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="border-sidebar-border pt-1">
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === child.href}
                >
                  <Link href={child.href}>
                    <child.icon />
                    <span>{child.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
