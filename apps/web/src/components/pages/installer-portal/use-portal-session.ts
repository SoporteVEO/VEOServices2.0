"use client";

import type { SubRole, UserRole } from "@/api/users/users.types";
import { authClient } from "@/lib/auth-client";
import {
  portalCapabilitiesFor,
  type PortalCapabilities,
} from "@/lib/installer-portal";

export interface PortalSession {
  role: UserRole | undefined;
  subRoles: SubRole[];
  capabilities: PortalCapabilities;
  isPending: boolean;
  hasSession: boolean;
}

/**
 * The portal's view of the signed-in user. Both the guard and the task screens
 * read from here so the access decision and the rendered controls can never
 * disagree about who is looking.
 */
export function usePortalSession(): PortalSession {
  const { data: session, isPending } = authClient.useSession();

  const sessionUser = session?.user as Record<string, unknown> | undefined;
  const role = sessionUser?.role as UserRole | undefined;
  const subRoles = (sessionUser?.subRoles as SubRole[] | undefined) ?? [];

  return {
    role,
    subRoles,
    capabilities: portalCapabilitiesFor(role, subRoles),
    isPending,
    hasSession: Boolean(session),
  };
}
