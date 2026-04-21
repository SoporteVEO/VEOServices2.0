"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/api/users/users.types";
import { authClient } from "@/lib/auth-client";

const LIMITED_ALLOWED_PATH = "/dashboard/images";

function isLimitedAllowedPath(pathname: string): boolean {
  return (
    pathname === LIMITED_ALLOWED_PATH ||
    pathname.startsWith(`${LIMITED_ALLOWED_PATH}/`)
  );
}

export function LimitedRoleRedirect({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const userRole = (session?.user as Record<string, unknown> | undefined)
    ?.role as UserRole | undefined;

  const shouldRedirect =
    userRole === "LIMITED" && !isLimitedAllowedPath(pathname);

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(LIMITED_ALLOWED_PATH);
    }
  }, [shouldRedirect, router]);

  if (isPending || shouldRedirect) {
    return null;
  }

  return <>{children}</>;
}
