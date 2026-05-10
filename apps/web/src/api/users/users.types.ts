export type UserRole = "ADMIN" | "USER" | "LIMITED";

export type SubRole = "HR" | "USERS_MANAGEMENT";

export type User = {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: UserRole;
  subRoles: SubRole[];
  createdAt: string;
  emailVerified: boolean;
  image: string | null;
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
};
