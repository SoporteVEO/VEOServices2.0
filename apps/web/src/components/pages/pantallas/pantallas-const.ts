import type {
  CampaignArt,
  CampaignDeal,
  OrderArtFormat,
  OrderStatus,
  PantallasLogType,
} from "@/api/pantallas/pantallas.types";

export const ALERT_DAYS = 7;
export const FULL_SUBLIST_SPOTS = 900;
export const HALF_SUBLIST_SPOTS = 450;
export const MAX_OPERATING_HOURS = 23;
export const SUGGESTED_TURN_ON = "05:30";
export const DURATION_PRESETS = [18, 20, 21, 23];
export const ORDER_SPOT_PRESETS = [300, 450, 600, 900];
export const DEFAULT_VALIDITY_DAYS = 30;

export const CAMPAIGN_SPOT_PRESETS = [
  { value: 900, label: "900 · lista completa" },
  { value: 600, label: "600" },
  { value: 450, label: "450 · ½ lista" },
  { value: 300, label: "300 · ⅓ lista" },
];

export type CampaignStatus =
  | "ACTIVE"
  | "EXPIRING"
  | "FINISHED"
  | "SCHEDULED"
  | "UNDATED"
  | "PAUSED";

export type VersionStatus =
  | "CURRENT"
  | "EXPIRING"
  | "EXPIRED"
  | "SCHEDULED"
  | "UNDATED";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  ACTIVE: "Activa",
  EXPIRING: "Por vencer",
  FINISHED: "Finalizada",
  SCHEDULED: "Programada",
  UNDATED: "Sin fechas",
  PAUSED: "Pausada",
};

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  CURRENT: "Vigente",
  EXPIRING: "Por vencer",
  EXPIRED: "Vencida",
  SCHEDULED: "Programada",
  UNDATED: "Sin fechas",
};

export type StatusTone =
  | "good"
  | "warning"
  | "critical"
  | "paused"
  | "accent"
  | "muted";

export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, StatusTone> = {
  ACTIVE: "good",
  EXPIRING: "warning",
  FINISHED: "critical",
  SCHEDULED: "accent",
  UNDATED: "muted",
  PAUSED: "paused",
};

export const VERSION_STATUS_TONE: Record<VersionStatus, StatusTone> = {
  CURRENT: "good",
  EXPIRING: "warning",
  EXPIRED: "critical",
  SCHEDULED: "accent",
  UNDATED: "muted",
};

export const TONE_BADGE_CLASS: Record<StatusTone, string> = {
  good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  critical: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
  paused: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  accent: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  muted: "border-border bg-muted text-muted-foreground",
};

export const TONE_DOT_CLASS: Record<StatusTone, string> = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
  paused: "bg-violet-500",
  accent: "bg-sky-500",
  muted: "bg-muted-foreground/60",
};

export const TONE_BORDER_CLASS: Record<StatusTone, string> = {
  good: "border-l-emerald-500",
  warning: "border-l-amber-500",
  critical: "border-l-red-500",
  paused: "border-l-violet-500",
  accent: "border-l-sky-500",
  muted: "border-l-muted-foreground/40",
};

export const CAMPAIGN_STATUS_ORDER: Record<CampaignStatus, number> = {
  ACTIVE: 0,
  EXPIRING: 1,
  PAUSED: 2,
  SCHEDULED: 3,
  UNDATED: 4,
  FINISHED: 5,
};

export const ART_LABELS: Record<CampaignArt, string> = {
  RECEIVED: "Arte recibido",
  MISSING: "Sin arte",
  PENDING_APPROVAL: "Arte en aprobación",
};

export const ART_OPTIONS: CampaignArt[] = [
  "RECEIVED",
  "MISSING",
  "PENDING_APPROVAL",
];

export const ART_BADGE_CLASS: Record<CampaignArt, string> = {
  RECEIVED: TONE_BADGE_CLASS.good,
  MISSING: TONE_BADGE_CLASS.critical,
  PENDING_APPROVAL: TONE_BADGE_CLASS.warning,
};

export const DEAL_LABELS: Record<CampaignDeal, string> = {
  COMMERCIAL: "No aplica",
  DONATION: "Donación",
  EXCHANGE: "Canje",
  DATION: "Dación",
  BONUS: "Bonificación",
};

export const DEAL_SHORT_LABELS: Record<CampaignDeal, string> = {
  ...DEAL_LABELS,
  COMMERCIAL: "Comercial",
};

export const DEAL_OPTIONS: CampaignDeal[] = [
  "COMMERCIAL",
  "DONATION",
  "EXCHANGE",
  "DATION",
  "BONUS",
];

export const DEAL_BADGE_CLASS: Record<CampaignDeal, string> = {
  COMMERCIAL: TONE_BADGE_CLASS.muted,
  DONATION: "border-pink-500/40 bg-pink-500/10 text-pink-700 dark:text-pink-400",
  EXCHANGE: "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-400",
  DATION: "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  BONUS: "border-lime-500/40 bg-lime-500/10 text-lime-700 dark:text-lime-500",
};

export const LOG_TYPE_LABELS: Record<PantallasLogType, string> = {
  NEW: "Nuevo",
  RENEWED: "Renovada",
  EXTENDED: "Extendida",
  SHORTENED: "Recortada",
  EDITED: "Editada",
  PAUSED: "Pausada",
  RESUMED: "Reanudada",
  MOVED: "Movida",
  REMOVED: "Eliminada",
};

export const SCREEN_CHANGE_LABELS: Record<string, string> = {
  agregada: "agregada",
  modificada: "modificada",
  movida: "movida",
  pausada: "pausada",
  reanudada: "reanudada",
  eliminada: "eliminada",
};

export const ART_FORMAT_LABELS: Record<OrderArtFormat, string> = {
  ANIMATED: "Animado",
  STATIC: "Estático",
  VIDEO: "Video",
};

export const ART_FORMAT_OPTIONS: OrderArtFormat[] = ["ANIMATED", "STATIC", "VIDEO"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Esperando a Producción",
  INGESTED: "Ingresada",
  RETURNED: "Devuelta a Soporte",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  PENDING: "accent",
  INGESTED: "good",
  RETURNED: "warning",
};
