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
  INSTALLER: {
    label: "Instalador",
    variant: "outline",
    className:
      "border-teal-500/50 bg-teal-500/10 text-teal-700 dark:text-teal-400",
  },
  WORKER: {
    label: "Operario",
    variant: "outline",
    className:
      "border-slate-500/50 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  MANTENIMIENTO: {
    label: "Mantenimiento",
    variant: "outline",
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

export const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
}[] = [
  {
    value: "USER",
    label: "Usuario",
    description: "Acceso estándar al dashboard",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Acceso total, incluida analítica y herramientas",
  },
  {
    value: "LIMITED",
    label: "Limitado",
    description: "Solo puede subir y consultar imágenes",
  },
  {
    value: "INSTALLER",
    label: "Instalador",
    description:
      "Solo accede al portal móvil de instalaciones asignadas mediante QR",
  },
  {
    value: "WORKER",
    label: "Operario",
    description:
      "Solo accede al portal móvil de instalaciones asignadas mediante QR",
  },
  {
    value: "MANTENIMIENTO",
    label: "Mantenimiento",
    description:
      "Solo accede al portal móvil con sus órdenes de mantenimiento asignadas",
  },
];

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
  PRODUCTION: {
    label: "Producción",
    variant: "outline",
    className:
      "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  MANTENIMIENTO: {
    label: "Mantenimiento",
    variant: "outline",
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
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
  {
    value: "PRODUCTION",
    label: "Producción",
    description:
      "Acceso al módulo de producción para gestionar órdenes por valla estática",
  },
  {
    value: "MANTENIMIENTO",
    label: "Mantenimiento",
    description:
      "Acceso al módulo de mantenimiento para asignar y dar seguimiento a órdenes",
  },
];
