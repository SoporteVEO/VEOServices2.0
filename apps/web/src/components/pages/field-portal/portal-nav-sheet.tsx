"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, type LucideIcon } from "lucide-react";
import type { SubRole, UserRole } from "@/api/users/users.types";
import { Button } from "@/components/primitives/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/primitives/ui/sheet";
import { authClient } from "@/lib/auth-client";
import {
  fieldPortalsFor,
  PORTAL_BASE,
  PORTAL_ICON,
  PORTAL_LABEL,
} from "@/lib/portal-access";
import { canAccessItem, IMAGES_NAV_ITEM } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface Destination {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface DestinationSection {
  label: string;
  destinations: Destination[];
}

function sectionsFor(
  role: UserRole | undefined,
  subRoles: SubRole[],
): DestinationSection[] {
  const sections: DestinationSection[] = [];

  const portals = fieldPortalsFor(role, subRoles).map((portal) => ({
    label: PORTAL_LABEL[portal],
    href: PORTAL_BASE[portal],
    icon: PORTAL_ICON[portal],
  }));
  if (portals.length > 0) {
    sections.push({ label: "Portales", destinations: portals });
  }

  if (canAccessItem(IMAGES_NAV_ITEM, role, subRoles)) {
    sections.push({
      label: "Módulos",
      destinations: [
        {
          label: IMAGES_NAV_ITEM.title,
          href: IMAGES_NAV_ITEM.href,
          icon: IMAGES_NAV_ITEM.icon,
        },
      ],
    });
  }

  return sections;
}

/**
 * Side panel listing everywhere a field user may go: the portals their role
 * grants plus the dashboard modules they can open. Renders nothing when there
 * is only one destination, so the header stays uncluttered for the roles that
 * never leave their portal.
 */
export function PortalNavSheet() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const sessionUser = session?.user as Record<string, unknown> | undefined;
  const role = sessionUser?.role as UserRole | undefined;
  const subRoles = (sessionUser?.subRoles as SubRole[] | undefined) ?? [];

  const sections = sectionsFor(role, subRoles);
  const total = sections.reduce((n, s) => n + s.destinations.length, 0);
  if (total < 2) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menú">
          <Menu />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="gap-0">
        <SheetHeader className="border-b pe-12">
          <SheetTitle>{session?.user?.name ?? "Mi panel"}</SheetTitle>
          <SheetDescription className="truncate">
            {session?.user?.email ?? "VEO Services"}
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col gap-4 overflow-y-auto p-3">
          {sections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <p className="px-2 text-xs font-medium text-muted-foreground">
                {section.label}
              </p>
              {section.destinations.map((destination) => {
                const isActive =
                  pathname === destination.href ||
                  pathname.startsWith(`${destination.href}/`);

                return (
                  <SheetClose asChild key={destination.href}>
                    <Link
                      href={destination.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <destination.icon className="size-4" aria-hidden />
                      {destination.label}
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
