import { format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  FeatureRequestPriority,
  FeatureRequestStatus,
  FeatureRequestUser,
} from "@/api/feature-requests/feature-requests.types";

export const FEATURE_REQUEST_TEMPLATE_URL =
  "/templates/Solicitud_Nueva_Funcionalidad.docx";
export const FEATURE_REQUEST_TEMPLATE_NAME = "Solicitud_Nueva_Funcionalidad.docx";

export const MIN_TITLE_LENGTH = 3;
export const MAX_TITLE_LENGTH = 120;
export const MIN_SUMMARY_LENGTH = 10;
export const MAX_SUMMARY_LENGTH = 2000;
export const MAX_MESSAGE_LENGTH = 2000;
export const MIN_PROBLEM_LENGTH = 5;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const DEFAULT_PAGE_SIZE = 25;
export const DEV_SEARCH_PLACEHOLDER =
  "Buscar por ticket (SF-0001), título o solicitante...";

export const STATUS_ORDER: FeatureRequestStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "IN_PROGRESS",
  "COMPLETED",
  "APPROVED",
  "REJECTED",
];

export const STATUS_LABELS: Record<FeatureRequestStatus, string> = {
  SUBMITTED: "Enviada",
  IN_REVIEW: "En revisión",
  IN_PROGRESS: "En desarrollo",
  COMPLETED: "Por aprobar",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export const STATUS_TAB_LABELS: Record<FeatureRequestStatus, string> = {
  SUBMITTED: "Nuevas",
  IN_REVIEW: "En revisión",
  IN_PROGRESS: "En desarrollo",
  COMPLETED: "Por aprobar",
  APPROVED: "Aprobadas",
  REJECTED: "Rechazadas",
};

export const STATUS_STYLES: Record<FeatureRequestStatus, string> = {
  SUBMITTED: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  IN_REVIEW:
    "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  IN_PROGRESS:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETED:
    "border-teal-500/50 bg-teal-500/10 text-teal-700 dark:text-teal-400",
  APPROVED:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

export const PRIORITY_ORDER: FeatureRequestPriority[] = ["HIGH", "MEDIUM", "LOW"];

export const PRIORITY_LABELS: Record<FeatureRequestPriority, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

export const PRIORITY_HINTS: Record<FeatureRequestPriority, string> = {
  HIGH: "Alta · impide trabajar",
  MEDIUM: "Media · ahorra tiempo o evita errores",
  LOW: "Baja · mejora opcional",
};

export const PRIORITY_STYLES: Record<FeatureRequestPriority, string> = {
  HIGH: "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  MEDIUM:
    "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  LOW: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

/** What users see per tab: open work first, closed requests apart. */
export const USER_TABS = ["active", "closed", "all"] as const;
export type UserTab = (typeof USER_TABS)[number];

export const USER_TAB_LABELS: Record<UserTab, string> = {
  active: "Activas",
  closed: "Cerradas",
  all: "Todas",
};

export const CLOSED_STATUSES: FeatureRequestStatus[] = ["APPROVED", "REJECTED"];

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

export function userName(user: FeatureRequestUser | null): string {
  if (!user) return "Usuario eliminado";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}
