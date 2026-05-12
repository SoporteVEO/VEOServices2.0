import type { SubRole, UserRole } from "@/api/users/users.types";

type BadgeStyle = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
};

export const roleBadge: Record<UserRole, BadgeStyle> = {
  ADMIN: { label: "Admin", variant: "destructive" },
  USER: {
    label: "Usuario",
    variant: "outline",
    className:
      "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  },
  LIMITED: {
    label: "Limitado",
    variant: "outline",
    className:
      "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
};

export const subRoleBadge: Record<SubRole, BadgeStyle> = {
  HR: {
    label: "RRHH",
    variant: "outline",
    className:
      "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  USERS_MANAGEMENT: {
    label: "Gestión de usuarios",
    variant: "outline",
    className:
      "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
};

export const SUB_ROLE_OPTIONS: { value: SubRole; label: string; description: string }[] = [
  {
    value: "HR",
    label: "Recursos Humanos",
    description: "Acceso al módulo de RRHH",
  },
  {
    value: "USERS_MANAGEMENT",
    label: "Gestión de usuarios",
    description: "Acceso al módulo de gestión de usuarios",
  },
];
