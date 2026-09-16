import { Role } from '@prisma/client';

/**
 * Single source of truth for what each field role is allowed to do. Field staff
 * work on site and reach nothing in the API beyond the endpoints that name them,
 * so every guard, controller and assignment query reads its role list from here
 * rather than comparing roles inline. Adding a role that combines two jobs then
 * means editing this file only.
 */

/** Mounts the panel on site and files the installation photo. */
export const INSTALLATION_ROLES: Role[] = [
  Role.INSTALLER,
  Role.INSTALLER_MANTENIMIENTO,
];

/** Vulcanises the printed material in the shop and files that photo. */
export const VULCANIZADO_ROLES: Role[] = [Role.WORKER];

/** May be put on the hook for a physical billboard installation. */
export const INSTALLER_ROLES: Role[] = [
  ...INSTALLATION_ROLES,
  ...VULCANIZADO_ROLES,
];

/** Carries out maintenance work orders. */
export const MAINTENANCE_ROLES: Role[] = [
  Role.MANTENIMIENTO,
  Role.INSTALLER_MANTENIMIENTO,
];

/**
 * Roles with no dashboard at all. Their access is deny-by-default: the guard
 * only lets them through on endpoints that list them explicitly, so a new
 * controller never widens their reach by accident.
 */
export const FIELD_ROLES: ReadonlySet<string> = new Set<string>([
  ...INSTALLER_ROLES,
  ...MAINTENANCE_ROLES,
]);

/**
 * Field roles that also reach the Imágenes module, on the same reduced surface
 * LIMITED gets. The operario never leaves the shop floor, so vulcanizado is
 * deliberately left out.
 */
export const IMAGES_MODULE_ROLES: Role[] = [
  ...new Set([...INSTALLATION_ROLES, ...MAINTENANCE_ROLES]),
];

export function isMaintenanceRole(role: string | null | undefined): boolean {
  return MAINTENANCE_ROLES.includes(role as Role);
}
