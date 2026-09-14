"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hammer, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SubRole, UserRole } from "@/api/users/users.types";
import { authClient } from "@/lib/auth-client";
import {
  fieldPortalsFor,
  PORTAL_BASE,
  PORTAL_LABEL,
  type FieldPortal,
} from "@/lib/portal-access";
import { cn } from "@/lib/utils";

const PORTAL_ICON: Record<FieldPortal, LucideIcon> = {
  installer: Hammer,
  maintenance: Wrench,
};

/**
 * Lets someone who works both jobs move between their portals. Renders nothing
 * for the usual case of a single portal, so the header stays uncluttered for
 * the field roles that only ever see one.
 */
export function PortalSwitcher() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const sessionUser = session?.user as Record<string, unknown> | undefined;
  const role = sessionUser?.role as UserRole | undefined;
  const subRoles = (sessionUser?.subRoles as SubRole[] | undefined) ?? [];

  const portals = fieldPortalsFor(role, subRoles);
  if (portals.length < 2) return null;

  return (
    <nav
      aria-label="Cambiar de portal"
      className="flex shrink-0 items-center gap-0.5 rounded-lg bg-muted p-0.5"
    >
      {portals.map((portal) => {
        const base = PORTAL_BASE[portal];
        const Icon = PORTAL_ICON[portal];
        const isActive = pathname === base || pathname.startsWith(`${base}/`);

        return (
          <Link
            key={portal}
            href={base}
            aria-current={isActive ? "page" : undefined}
            title={PORTAL_LABEL[portal]}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="sr-only">{PORTAL_LABEL[portal]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
