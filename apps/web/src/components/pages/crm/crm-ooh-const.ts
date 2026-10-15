import { Layers, Monitor, Signpost, type LucideIcon } from "lucide-react";
import type { CrmMediaType } from "@/api/crm/crm.types";
import type {
  CrmSiteKind,
  CrmSiteStatus,
  InventoryState,
} from "@/api/crm/crm-ooh.types";

export const MEDIA_TYPE_ORDER: CrmMediaType[] = ["STATIC", "DIGITAL", "MIXED"];

export const MEDIA_TYPE_LABELS: Record<CrmMediaType, string> = {
  STATIC: "Estática",
  DIGITAL: "Digital",
  MIXED: "Mixta",
};

export const MEDIA_TYPE_ICONS: Record<CrmMediaType, LucideIcon> = {
  STATIC: Signpost,
  DIGITAL: Monitor,
  MIXED: Layers,
};

export const MEDIA_TYPE_STYLES: Record<CrmMediaType, string> = {
  STATIC: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  DIGITAL: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  MIXED: "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300",
};

export const SITE_KIND_LABELS: Record<CrmSiteKind, string> = {
  STATIC: "Valla",
  DIGITAL: "Pantalla",
};

export const SITE_KIND_ICONS: Record<CrmSiteKind, LucideIcon> = {
  STATIC: Signpost,
  DIGITAL: Monitor,
};

export const SITE_STATUS_LABELS: Record<CrmSiteStatus, string> = {
  PROPOSED: "Propuesta",
  HELD: "Reservada",
  BOOKED: "Vendida",
  RELEASED: "Liberada",
};

export const SITE_STATUS_STYLES: Record<CrmSiteStatus, string> = {
  PROPOSED: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  HELD: "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  BOOKED: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  RELEASED: "border-border bg-muted text-muted-foreground",
};

export const INVENTORY_STATE_LABELS: Record<InventoryState, string> = {
  AVAILABLE: "Disponible",
  HELD: "Con reserva",
  BOOKED: "Vendida (CRM)",
  CONTRACTED: "Contratada",
  FULL: "Sin cupo",
};

export const INVENTORY_STATE_STYLES: Record<InventoryState, string> = {
  AVAILABLE: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  HELD: "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  BOOKED: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CONTRACTED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
  FULL: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

/** Competitive categories; spelling must match across deals for separation warnings. */
export const OOH_INDUSTRIES = [
  "Automotriz",
  "Banca y finanzas",
  "Bebidas alcohólicas",
  "Bebidas no alcohólicas",
  "Comida rápida y restaurantes",
  "Construcción e inmobiliaria",
  "Educación",
  "Entretenimiento y eventos",
  "Gobierno e instituciones",
  "Hogar y electrodomésticos",
  "Moda y belleza",
  "Retail y supermercados",
  "Salud y farmacéutica",
  "Seguros",
  "Telecomunicaciones",
  "Tecnología",
  "Turismo y aerolíneas",
  "Alimentos de consumo masivo",
  "Energía y combustibles",
  "Otro",
];

export const SV_DEPARTMENTS = [
  "Ahuachapán",
  "Cabañas",
  "Chalatenango",
  "Cuscatlán",
  "La Libertad",
  "La Paz",
  "La Unión",
  "Morazán",
  "San Miguel",
  "San Salvador",
  "San Vicente",
  "Santa Ana",
  "Sonsonate",
  "Usulután",
];

export const HOLD_DAY_OPTIONS = [3, 7, 14, 30];
export const DEFAULT_SPOTS_PER_DAY = 30;
