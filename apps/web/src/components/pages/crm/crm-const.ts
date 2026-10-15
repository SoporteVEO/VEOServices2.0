import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  FileText,
  Flag,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  CrmActivityType,
  CrmDealSource,
  CrmDealStatus,
  CrmMessageStatus,
  CrmPriority,
  CrmTaskType,
  OfferStatus,
} from "@/api/crm/crm.types";

export const DEAL_STATUS_LABELS: Record<CrmDealStatus, string> = {
  OPEN: "Abierto",
  WON: "Ganado",
  LOST: "Perdido",
};

export const DEAL_STATUS_STYLES: Record<CrmDealStatus, string> = {
  OPEN: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  WON: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  LOST: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

export const PRIORITY_ORDER: CrmPriority[] = ["LOW", "MEDIUM", "HIGH"];

export const PRIORITY_LABELS: Record<CrmPriority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

export const PRIORITY_STYLES: Record<CrmPriority, string> = {
  LOW: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  MEDIUM: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  HIGH: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

export const SOURCE_ORDER: CrmDealSource[] = [
  "REFERRAL",
  "WEBSITE",
  "COLD_CALL",
  "EVENT",
  "SOCIAL_MEDIA",
  "EXISTING_CLIENT",
  "AGENCY",
  "RENEWAL",
  "WEB_SHOP",
  "OFFER",
  "OTHER",
];

export const SOURCE_LABELS: Record<CrmDealSource, string> = {
  REFERRAL: "Referido",
  WEBSITE: "Sitio web",
  COLD_CALL: "Llamada en frío",
  EVENT: "Evento",
  SOCIAL_MEDIA: "Redes sociales",
  EXISTING_CLIENT: "Cliente existente",
  AGENCY: "Agencia",
  OFFER: "Cotización",
  RENEWAL: "Renovación",
  WEB_SHOP: "Tienda en línea",
  OTHER: "Otro",
};

export const ACTIVITY_LABELS: Record<CrmActivityType, string> = {
  NOTE: "Nota",
  CALL: "Llamada",
  MEETING: "Reunión",
  EMAIL: "Correo",
  WHATSAPP: "WhatsApp",
  TASK_COMPLETED: "Tarea completada",
  STAGE_CHANGED: "Cambio de etapa",
  DEAL_CREATED: "Negocio creado",
  DEAL_WON: "Negocio ganado",
  DEAL_LOST: "Negocio perdido",
  DEAL_REOPENED: "Negocio reabierto",
  OFFER_LINKED: "Cotización vinculada",
  INVENTORY_CHANGED: "Inventario",
};

export const ACTIVITY_ICONS: Record<CrmActivityType, LucideIcon> = {
  NOTE: FileText,
  CALL: Phone,
  MEETING: Users,
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  TASK_COMPLETED: CheckCircle2,
  STAGE_CHANGED: Flag,
  DEAL_CREATED: Sparkles,
  DEAL_WON: Trophy,
  DEAL_LOST: XCircle,
  DEAL_REOPENED: RotateCcw,
  OFFER_LINKED: Briefcase,
  INVENTORY_CHANGED: MapPin,
};

export const ACTIVITY_TONES: Record<CrmActivityType, string> = {
  NOTE: "bg-muted text-muted-foreground",
  CALL: "bg-info-soft text-info",
  MEETING: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  EMAIL: "bg-info-soft text-info",
  WHATSAPP: "bg-success-soft text-success",
  TASK_COMPLETED: "bg-success-soft text-success",
  STAGE_CHANGED: "bg-warning-soft text-warning",
  DEAL_CREATED: "bg-veo-ice text-veo-dark dark:bg-veo-dark-80 dark:text-veo-ice",
  DEAL_WON: "bg-success-soft text-success",
  DEAL_LOST: "bg-destructive-soft text-destructive",
  DEAL_REOPENED: "bg-warning-soft text-warning",
  OFFER_LINKED: "bg-veo-ice text-veo-dark dark:bg-veo-dark-80 dark:text-veo-ice",
  INVENTORY_CHANGED:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

export const TASK_TYPE_ORDER: CrmTaskType[] = [
  "CALL",
  "EMAIL",
  "WHATSAPP",
  "MEETING",
  "FOLLOW_UP",
  "OTHER",
];

export const TASK_TYPE_LABELS: Record<CrmTaskType, string> = {
  CALL: "Llamada",
  EMAIL: "Correo",
  WHATSAPP: "WhatsApp",
  MEETING: "Reunión",
  FOLLOW_UP: "Seguimiento",
  OTHER: "Otro",
};

export const TASK_TYPE_ICONS: Record<CrmTaskType, LucideIcon> = {
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  MEETING: Users,
  FOLLOW_UP: CalendarClock,
  OTHER: MessageSquare,
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptada",
  DECLINED: "Rechazada",
};

export const OFFER_STATUS_STYLES: Record<OfferStatus, string> = {
  PENDING: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ACCEPTED:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  DECLINED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

export const MESSAGE_STATUS_LABELS: Record<CrmMessageStatus, string> = {
  SENT: "Enviado",
  DELIVERED: "Entregado",
  READ: "Leído",
  FAILED: "Falló",
  RECEIVED: "Recibido",
};

export const STAGE_COLOR_PALETTE = [
  "#94A3B8",
  "#38BDF8",
  "#A78BFA",
  "#F59E0B",
  "#F472B6",
  "#2DD4BF",
  "#22C55E",
  "#EF4444",
];

export const DEFAULT_STAGE_COLOR = "#94A3B8";

/** Sentinel for "no value" options in Select/Combobox, which reject empty strings. */
export const NONE = "__none__";
