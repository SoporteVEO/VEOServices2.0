import {
  isFieldRole,
  isMaintenanceFieldRole,
  type SubRole,
  type UserRole,
} from "@/api/users/users.types";
import { INSTALLER_PORTAL_BASE } from "@/lib/installer-portal";
import { MAINTENANCE_PORTAL_BASE } from "@/lib/maintenance-portal";

/**
 * Which mobile portals a user may open. A role can grant both — a technician who
 * also mounts panels holds INSTALLER_MANTENIMIENTO — so access is a set rather
 * than a single destination, and every guard resolves it from here.
 */
export type FieldPortal = "installer" | "maintenance";

export const PORTAL_BASE: Record<FieldPortal, string> = {
  installer: INSTALLER_PORTAL_BASE,
  maintenance: MAINTENANCE_PORTAL_BASE,
};

export const PORTAL_LABEL: Record<FieldPortal, string> = {
  installer: "Instalaciones",
  maintenance: "Mantenimiento",
};

/**
 * Admins and the production team can open the installer portal to verify what a
 * printed QR resolves to; maintenance supervisors do the same for their portal.
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

export function canAccessMaintenancePortal(
  role: UserRole | undefined | null,
  subRoles: SubRole[] = [],
): boolean {
  if (!role) return false;
  if (isMaintenanceFieldRole(role)) return true;
  if (role === "ADMIN") return true;
  return subRoles.includes("MANTENIMIENTO");
}

export function fieldPortalsFor(
  role: UserRole | undefined | null,
  subRoles: SubRole[] = [],
): FieldPortal[] {
  const portals: FieldPortal[] = [];
  if (canAccessInstallerPortal(role, subRoles)) portals.push("installer");
  if (canAccessMaintenancePortal(role, subRoles)) portals.push("maintenance");
  return portals;
}

/**
 * Where a user with no dashboard belongs. When a role grants both portals the
 * user lands on the installer portal and switches from the header, so there is
 * no extra screen between signing in and the day's work.
 */
export function portalHomeFor(
  role: UserRole | undefined | null,
  subRoles: SubRole[] = [],
): string {
  const [first] = fieldPortalsFor(role, subRoles);
  return first ? PORTAL_BASE[first] : PORTAL_BASE.installer;
}
