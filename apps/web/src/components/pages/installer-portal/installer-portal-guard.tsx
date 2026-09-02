"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalSession } from "./use-portal-session";

/**
 * The portal is built for INSTALLER/WORKER, but admins and the production
 * team can open it too so they can verify what a printed QR resolves to.
 * Access follows the capability map: anyone with nothing to do here is sent
 * back to the dashboard.
 */
export function InstallerPortalGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { capabilities, isPending, hasSession } = usePortalSession();

  const canUsePortal =
    capabilities.canSeeLocation ||
    capabilities.canUploadInstallation ||
    capabilities.canUploadVulcanizado;
  const isAllowed = !isPending && hasSession && canUsePortal;

  // Kept as a primitive so the effect only reruns when the destination
  // actually changes, not on every render of the derived values above.
  let redirectTo: string | null = null;
  if (!isPending && !hasSession) {
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
