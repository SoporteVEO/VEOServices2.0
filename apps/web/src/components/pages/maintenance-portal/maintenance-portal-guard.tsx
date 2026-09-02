"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SubRole, UserRole } from "@/api/users/users.types";
import { authClient } from "@/lib/auth-client";

/**
 * The maintenance portal is for the MANTENIMIENTO role. Admins and users
 * holding the MANTENIMIENTO sub-role can open it too so a supervisor can see
 * exactly what a technician sees.
 */
function canAccessPortal(role: UserRole | undefined, subRoles: SubRole[]) {
  if (!role) return false;
  if (role === "MANTENIMIENTO" || role === "ADMIN") return true;
  return subRoles.includes("MANTENIMIENTO");
}

export function MaintenancePortalGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const sessionUser = session?.user as Record<string, unknown> | undefined;
  const role = sessionUser?.role as UserRole | undefined;
  const subRoles = (sessionUser?.subRoles as SubRole[] | undefined) ?? [];

  const isAllowed = !isPending && !!session && canAccessPortal(role, subRoles);

  // Kept as a primitive so the effect only reruns when the destination
  // actually changes, not on every render of the derived arrays above.
  let redirectTo: string | null = null;
  if (!isPending && !session) {
    redirectTo = `/?redirect=${encodeURIComponent(pathname)}`;
  } else if (!isPending && !isAllowed) {
    redirectTo = "/dashboard";
  }

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!isAllowed) return null;

  return <>{children}</>;
}
