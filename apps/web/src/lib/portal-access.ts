import { ClipboardList, type LucideIcon } from "lucide-react";
import {
  isFieldRole,
  isMaintenanceFieldRole,
  type SubRole,
  type UserRole,
} from "@/api/users/users.types";
import { INSTALLER_PORTAL_BASE } from "@/lib/installer-portal";

/**
 * Field staff get one portal, "Mis órdenes", listing installation and
 * maintenance jobs side by side. Which kinds of job a user sees inside it is
 * still decided per kind, since a role can hold either or both.
 */
export const FIELD_PORTAL_BASE = INSTALLER_PORTAL_BASE;
export const FIELD_PORTAL_LABEL = "Mis órdenes";
export const FIELD_PORTAL_ICON: LucideIcon = ClipboardList;

/**
 * Admins and the production team can open installation jobs to verify what a
 * printed QR resolves to.
 */
export function canAccessInstallerPortal(
  role: UserRole | undefined | null,
  subRoles: SubRole[] = [],
): boolean {
  if (!role) return false;
  if (isFieldRole(role)) return true;
  if (role === "ADMIN") return true;
  return role === "USER" && subRoles.includes("PRODUCTION");
}

/** Maintenance supervisors can open maintenance jobs to see what a technician sees. */
export function canAccessMaintenancePortal(
  role: UserRole | undefined | null,
  subRoles: SubRole[] = [],
): boolean {
  if (!role) return false;
  if (isMaintenanceFieldRole(role)) return true;
  if (role === "ADMIN") return true;
  return subRoles.includes("MANTENIMIENTO");
}

export function canAccessFieldPortal(
  role: UserRole | undefined | null,
  subRoles: SubRole[] = [],
): boolean {
  return (
    canAccessInstallerPortal(role, subRoles) ||
    canAccessMaintenancePortal(role, subRoles)
  );
}

/** Where a user with no dashboard belongs. */
export function portalHome(): string {
  return FIELD_PORTAL_BASE;
}
