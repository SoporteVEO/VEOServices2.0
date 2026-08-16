"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isFieldRole,
  type SubRole,
  type UserRole,
} from "@/api/users/users.types";
import { authClient } from "@/lib/auth-client";

/**
 * The portal is built for INSTALLER/WORKER, but admins and the production
 * team can open it too so they can verify what a printed QR resolves to.
 */
function canAccessPortal(role: UserRole | undefined, subRoles: SubRole[]) {
  if (!role) return false;
  if (isFieldRole(role) || role === "ADMIN") return true;
  return role === "USER" && subRoles.includes("PRODUCTION");
}

export function InstallerPortalGuard({ children }: { children: ReactNode }) {
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
