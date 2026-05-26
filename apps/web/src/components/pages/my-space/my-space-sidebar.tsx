"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MY_SPACE_NAV_ITEMS, MY_SPACE_SIDEBAR_TITLE } from "./const";

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/my-space") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MySpaceSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-0 w-56 shrink-0 self-stretch">
      <nav
        aria-label={MY_SPACE_SIDEBAR_TITLE}
        className="flex min-h-0 flex-1 w-full flex-col gap-1 rounded-none border-r border-border bg-card px-2 py-4"
      >
        <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {MY_SPACE_SIDEBAR_TITLE}
        </p>
        {MY_SPACE_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
