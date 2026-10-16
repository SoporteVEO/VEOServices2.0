import type {
  MaintenanceEventType,
  MaintenanceJobKind,
  MaintenanceJobStatus,
} from "@/api/maintenance/maintenance.types";

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceJobStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Finalizada",
  CLOSED: "Terminada",
  CANCELLED: "Cancelada",
};

export const MAINTENANCE_STATUS_STYLES: Record<MaintenanceJobStatus, string> = {
  PENDING:
    "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  IN_PROGRESS:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETED:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CLOSED: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  CANCELLED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

/**
 * Terminada and cancelled jobs are hidden from the working list, so they are
 * not a filter option there; Terminada has its own tab.
 */
export const MAINTENANCE_STATUS_ORDER: MaintenanceJobStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
];

export const MAINTENANCE_EVENT_LABELS: Record<MaintenanceEventType, string> = {
  CREATED: "Orden creada",
  UPDATED: "Datos actualizados",
  REASSIGNED: "Reasignada",
  RESCHEDULED: "Reprogramada",
  STARTED: "Trabajo iniciado",
  PHOTO_UPLOADED: "Evidencia agregada",
  PHOTO_DELETED: "Evidencia eliminada",
  COMMENTED: "Comentario",
  COMPLETED: "Trabajo finalizado",
  CLOSED: "Orden terminada",
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
  COMMENTED: "bg-indigo-400",
  COMPLETED: "bg-emerald-500",
  CLOSED: "bg-sky-600",
  REOPENED: "bg-amber-500",
  CANCELLED: "bg-red-500",
};

/** Wording that changes between the static billboard and Pantallas modules. */
export const MAINTENANCE_KIND_COPY: Record<
  MaintenanceJobKind,
  {
    target: string;
    targetPlaceholder: string;
    targetLoading: string;
    missingTarget: string;
    noCode: string;
    createDescription: string;
    searchPlaceholder: string;
    noTechnicians: string;
    categoryExamples: string;
    categoryPlaceholder: string;
  }
> = {
  STATIC: {
    target: "Valla estática",
    targetPlaceholder: "Selecciona una valla...",
    targetLoading: "Cargando vallas...",
    missingTarget: "Selecciona la valla estática.",
    noCode: "Sin código de valla",
    createDescription:
      "Asigna una valla estática a un usuario de mantenimiento.",
    searchPlaceholder: "Buscar por orden, valla o problema...",
    noTechnicians: "No hay usuarios con rol Mantenimiento.",
    categoryExamples:
      "Agrupa las órdenes por tipo de falla, por ejemplo estructura, iluminación o lona.",
    categoryPlaceholder: "Ej. Iluminación",
  },
  DIGITAL: {
    target: "Pantalla",
    targetPlaceholder: "Selecciona una pantalla...",
    targetLoading: "Cargando pantallas...",
    missingTarget: "Selecciona la pantalla.",
    noCode: "Sin código de pantalla",
    createDescription:
      "Asigna una pantalla a un usuario de Mantenimiento Pantallas.",
    searchPlaceholder: "Buscar por orden, pantalla o problema...",
    noTechnicians: "No hay usuarios con rol Mantenimiento Pantallas.",
    categoryExamples:
      "Agrupa las órdenes por tipo de falla, por ejemplo módulos LED, energía o conectividad.",
    categoryPlaceholder: "Ej. Módulos LED",
  },
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

/** "CODE · Name" for screens, just the code for static billboards. */
export function jobTargetLabel(job: {
  billboardCode: string | null;
  billboardName: string | null;
}): string | null {
  if (job.billboardCode && job.billboardName) {
    return `${job.billboardCode} · ${job.billboardName}`;
  }
  return job.billboardCode ?? job.billboardName;
}
