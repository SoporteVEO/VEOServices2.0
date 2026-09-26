"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalSession } from "@/components/pages/installer-portal/use-portal-session";
import { canAccessFieldPortal } from "@/lib/portal-access";

/**
 * Gate for "Mis órdenes". Anyone who can open at least one kind of job gets
 * in; the job screens then check their own kind.
 */
export function FieldPortalGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, subRoles, isPending, hasSession } = usePortalSession();

  const isAllowed =
    !isPending && hasSession && canAccessFieldPortal(role, subRoles);

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
