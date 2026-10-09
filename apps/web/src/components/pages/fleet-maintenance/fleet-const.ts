import type { FleetServiceType } from "@/api/fleet/fleet.types";

export const FLEET_SERVICE_TYPE_LABELS: Record<FleetServiceType, string> = {
  PREVENTIVE: "Preventivo",
  CORRECTIVE: "Correctivo",
  INSPECTION: "Inspección",
  OTHER: "Otro",
};

export const FLEET_SERVICE_TYPE_STYLES: Record<FleetServiceType, string> = {
  PREVENTIVE:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CORRECTIVE:
    "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
  INSPECTION:
    "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  OTHER:
    "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export const FLEET_SERVICE_TYPE_ORDER: FleetServiceType[] = [
  "PREVENTIVE",
  "CORRECTIVE",
  "INSPECTION",
  "OTHER",
];

const KM_FORMATTER = new Intl.NumberFormat("es-SV", {
  maximumFractionDigits: 0,
});

const COST_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatKm(value: number | null | undefined): string {
  return value == null ? "—" : `${KM_FORMATTER.format(value)} km`;
}

export function formatCost(value: number | null | undefined): string {
  return value == null ? "—" : COST_FORMATTER.format(value);
}

export function vehicleName(vehicle: {
  brand: string;
  model: string;
  year: number | null;
}): string {
  return [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ");
}

/** Parses a numeric text field; empty input means "not provided". */
export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
