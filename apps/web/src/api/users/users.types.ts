export type UserRole =
  | "ADMIN"
  | "USER"
  | "LIMITED"
  | "INSTALLER"
  | "WORKER"
  | "MANTENIMIENTO"
  | "INSTALLER_MANTENIMIENTO";

/** Roles whose users work in the field and file installation or vulcanizado work. */
export const FIELD_ROLES = [
  "INSTALLER",
  "WORKER",
  "INSTALLER_MANTENIMIENTO",
] as const satisfies readonly UserRole[];

/** Roles whose users carry out maintenance work orders. */
export const MAINTENANCE_FIELD_ROLES = [
  "MANTENIMIENTO",
  "INSTALLER_MANTENIMIENTO",
] as const satisfies readonly UserRole[];

export function isFieldRole(role: UserRole | undefined | null): boolean {
  return FIELD_ROLES.includes(role as (typeof FIELD_ROLES)[number]);
}

export function isMaintenanceFieldRole(
  role: UserRole | undefined | null,
): boolean {
  return MAINTENANCE_FIELD_ROLES.includes(
    role as (typeof MAINTENANCE_FIELD_ROLES)[number],
  );
}

/**
 * Roles with no dashboard at all. A role may grant more than one portal, so
 * callers need `portalHomeFor` rather than a single shared base path.
 */
export function isPortalOnlyRole(role: UserRole | undefined | null): boolean {
  return isFieldRole(role) || isMaintenanceFieldRole(role);
}

export type SubRole =
  | "HR"
  | "USERS_MANAGEMENT"
  | "PRODUCTION"
  | "MANTENIMIENTO";

export type User = {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: UserRole;
  subRoles: SubRole[];
  disabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  image: string | null;
};

export type UserLookupItem = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: UserRole;
};

export type CreateUserInput = {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  role?: UserRole;
  subRoles?: SubRole[];
};

export type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  subRoles?: SubRole[];
  disabled?: boolean;
};
