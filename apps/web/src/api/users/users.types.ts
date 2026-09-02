export type UserRole =
  | "ADMIN"
  | "USER"
  | "LIMITED"
  | "INSTALLER"
  | "WORKER"
  | "MANTENIMIENTO";

/** Roles whose users work in the field and only ever see the installer portal. */
export const FIELD_ROLES = ["INSTALLER", "WORKER"] as const;

export function isFieldRole(role: UserRole | undefined | null): boolean {
  return role === "INSTALLER" || role === "WORKER";
}

/**
 * Roles with no dashboard at all. Each one lands on its own mobile portal, so
 * callers need `portalHomeFor` rather than a single shared base path.
 */
export function isPortalOnlyRole(role: UserRole | undefined | null): boolean {
  return isFieldRole(role) || role === "MANTENIMIENTO";
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
