import type {
  MaintenanceEventType,
  MaintenanceJobStatus,
} from "@/api/maintenance/maintenance.types";

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceJobStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Finalizada",
  CANCELLED: "Cancelada",
};

export const MAINTENANCE_STATUS_STYLES: Record<MaintenanceJobStatus, string> = {
  PENDING:
    "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  IN_PROGRESS:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETED:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

export const MAINTENANCE_STATUS_ORDER: MaintenanceJobStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export const MAINTENANCE_EVENT_LABELS: Record<MaintenanceEventType, string> = {
  CREATED: "Orden creada",
  UPDATED: "Datos actualizados",
  REASSIGNED: "Reasignada",
  RESCHEDULED: "Reprogramada",
  STARTED: "Trabajo iniciado",
  PHOTO_UPLOADED: "Evidencia agregada",
  PHOTO_DELETED: "Evidencia eliminada",
  COMPLETED: "Trabajo finalizado",
  REOPENED: "Orden reabierta",
  CANCELLED: "Orden cancelada",
};

/** Colour of the timeline dot for each event, matching the status palette. */
export const MAINTENANCE_EVENT_DOT: Record<MaintenanceEventType, string> = {
  CREATED: "bg-sky-500",
  UPDATED: "bg-slate-400",
  REASSIGNED: "bg-purple-500",
  RESCHEDULED: "bg-purple-500",
  STARTED: "bg-amber-500",
  PHOTO_UPLOADED: "bg-cyan-500",
  PHOTO_DELETED: "bg-slate-400",
  COMPLETED: "bg-emerald-500",
  REOPENED: "bg-amber-500",
  CANCELLED: "bg-red-500",
};

export function formatMinutes(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours === 0 ? `${days} d` : `${days} d ${restHours} h`;
}

export function personName(person: {
  firstName: string;
  lastName: string | null;
}): string {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}
