"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isPortalOnlyRole } from "@/api/users/users.types";
import { canAccessInstallerPortal, portalHomeFor } from "@/lib/portal-access";
import { usePortalSession } from "./use-portal-session";

/**
 * The portal is built for the installation field roles, but admins and the
 * production team can open it too so they can verify what a printed QR resolves
 * to. Anyone with nothing to do here is sent to whichever portal or dashboard
 * they do belong to.
 */
export function InstallerPortalGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, subRoles, isPending, hasSession } = usePortalSession();

  const isAllowed =
    !isPending && hasSession && canAccessInstallerPortal(role, subRoles);

  // Kept as a primitive so the effect only reruns when the destination
  // actually changes, not on every render of the derived values above.
  let redirectTo: string | null = null;
  if (!isPending && !hasSession) {
    redirectTo = `/?redirect=${encodeURIComponent(pathname)}`;
  } else if (!isPending && !isAllowed) {
    redirectTo = isPortalOnlyRole(role)
      ? portalHomeFor(role, subRoles)
      : "/dashboard";
  }

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!isAllowed) return null;

  return <>{children}</>;
}
