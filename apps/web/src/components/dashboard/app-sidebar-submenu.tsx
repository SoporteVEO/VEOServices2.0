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

const MENU_BUTTON_CLASS =
  "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-accent data-[active=false]:hover:text-accent-foreground";

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
              className={MENU_BUTTON_CLASS}
              tooltip={{ children: item.title, side: "right", align: "center" }}
            >
              <item.icon className="size-4" />
              <span className="text-sm font-medium">{item.title}</span>
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
            className={MENU_BUTTON_CLASS}
            tooltip={{ children: item.title, side: "right", align: "center" }}
          >
            <item.icon className="size-4" />
            <span className="text-sm font-medium">{item.title}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="pt-1">
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
