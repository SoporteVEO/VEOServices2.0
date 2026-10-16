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
    label: "Vulcanizador",
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
  INSTALLER_MANTENIMIENTO: {
    label: "Instalador y mantenimiento",
    variant: "outline",
    className:
      "border-indigo-500/50 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  },
  MANTENIMIENTO_PANTALLAS: {
    label: "Mantenimiento Pantallas",
    variant: "outline",
    className:
      "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400",
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
      "Accede al portal móvil de instalaciones asignadas mediante QR y al módulo de imágenes",
  },
  {
    value: "WORKER",
    label: "Vulcanizador",
    description:
      "Solo accede al portal móvil para subir la imagen de vulcanizado de sus instalaciones asignadas",
  },
  {
    value: "MANTENIMIENTO",
    label: "Mantenimiento",
    description:
      "Accede al portal móvil con sus órdenes de mantenimiento asignadas y al módulo de imágenes",
  },
  {
    value: "INSTALLER_MANTENIMIENTO",
    label: "Instalador y mantenimiento",
    description:
      "Hace ambos trabajos: accede al portal de instalaciones, al de mantenimiento y al módulo de imágenes, y puede recibir asignaciones de los dos",
  },
  {
    value: "MANTENIMIENTO_PANTALLAS",
    label: "Mantenimiento Pantallas",
    description:
      "Accede al portal móvil con sus órdenes de mantenimiento de pantallas asignadas y al módulo de imágenes",
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
  PANTALLAS_PRODUCCION: {
    label: "Pantallas · Producción",
    variant: "outline",
    className:
      "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  PANTALLAS_COMERCIAL: {
    label: "Pantallas · Soporte Comercial",
    variant: "outline",
    className:
      "border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  },
  DESARROLLADOR: {
    label: "Desarrollador",
    variant: "outline",
    className:
      "border-lime-500/50 bg-lime-500/10 text-lime-700 dark:text-lime-400",
  },
  VENTAS: {
    label: "Ventas",
    variant: "outline",
    className:
      "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  CONTABILIDAD: {
    label: "Contabilidad",
    variant: "outline",
    className:
      "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  FINANZAS: {
    label: "Finanzas",
    variant: "outline",
    className:
      "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
  },
  FACTURACION: {
    label: "Facturación",
    variant: "outline",
    className:
      "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
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
      "Acceso al módulo de mantenimiento (vallas, pantallas y flota) para asignar y dar seguimiento a órdenes",
  },
  {
    value: "PANTALLAS_PRODUCCION",
    label: "Pantallas · Producción",
    description:
      "Administra las listas de reproducción: ingresa OP, edita campañas, sublistas y horarios",
  },
  {
    value: "PANTALLAS_COMERCIAL",
    label: "Pantallas · Soporte Comercial",
    description:
      "Consulta las pantallas, campañas y el Reporte OP sin modificar las listas",
  },
  {
    value: "DESARROLLADOR",
    label: "Desarrollador",
    description:
      "Acceso al módulo de Desarrollo: tickets de errores reportados por Nexo y revisión de sus aprendizajes",
  },
  {
    value: "VENTAS",
    label: "Ventas",
    description:
      "Acceso al CRM: pipelines, negocios, contactos, tareas, plantillas de correo y envío por Gmail y WhatsApp",
  },
  {
    value: "CONTABILIDAD",
    label: "Contabilidad",
    description:
      "Finanzas · Contabilidad: catálogo de cuentas, centros de costo y partidas contables de Brilo",
  },
  {
    value: "FINANZAS",
    label: "Finanzas",
    description:
      "Finanzas · Bancos y Cuentas por cobrar: abonos y cargos bancarios, saldos de clientes, cobros y anticipos en Brilo",
  },
  {
    value: "FACTURACION",
    label: "Facturación",
    description:
      "Finanzas · Facturación: facturas de venta, órdenes de facturación, PDF y envío por correo desde Brilo",
  },
];
