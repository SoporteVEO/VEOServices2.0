"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SubRole, UserRole } from "@/api/users/users.types";
import { authClient } from "@/lib/auth-client";
import { resolvePathAccess } from "@/lib/routes";

export function DashboardAccessGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const sessionUser = session?.user as Record<string, unknown> | undefined;
  const userRole = sessionUser?.role as UserRole | undefined;
  const userSubRoles = (sessionUser?.subRoles as SubRole[] | undefined) ?? [];

  const access =
    !isPending && userRole
      ? resolvePathAccess(pathname, userRole, userSubRoles)
      : null;

  useEffect(() => {
    if (access && !access.allowed) {
      router.replace(access.redirectTo);
    }
  }, [access, router]);

  if (isPending || !access || !access.allowed) {
    return null;
  }

  return <div>{children}</div>;
}
