export type UserRole =
  | "ADMIN"
  | "USER"
  | "LIMITED"
  | "INSTALLER"
  | "WORKER";

/** Roles whose users work in the field and only ever see the installer portal. */
export const FIELD_ROLES = ["INSTALLER", "WORKER"] as const;

export function isFieldRole(role: UserRole | undefined | null): boolean {
  return role === "INSTALLER" || role === "WORKER";
}

export type SubRole = "HR" | "USERS_MANAGEMENT" | "PRODUCTION";

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
