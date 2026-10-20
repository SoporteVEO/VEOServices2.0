"use client";

import type { SubRole } from "@/api/users/users.types";
import { authClient } from "@/lib/auth-client";

export function usePantallasAccess() {
  const { data: session } = authClient.useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const subRoles = (user?.subRoles as SubRole[] | undefined) ?? [];
  return {
    canEdit: subRoles.includes("PANTALLAS_PRODUCCION"),
    canRequest: subRoles.includes("PANTALLAS_COMERCIAL"),
  };
}
