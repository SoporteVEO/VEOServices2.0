import { format, startOfDay, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import type { PrintJob, PrintJobStatus } from "@/api/printing/printing.types";

export const MINUTE_MS = 60 * 1000;

/** Scheduling gestures snap their start to this grid so bars line up. */
export const SNAP_MINUTES = 15;

/** Days fetched before the operator scrolls the timeline any wider. */
export const DAYS_VISIBLE = 7;

/**
 * The shop's catalogue of panel sizes. Only used to preview how a machine's
 * configured speed translates into familiar print times - scheduling always
 * measures the real panel.
 */
export const PRINT_STANDARDS = [
  { label: "Valla estándar", width: 9, height: 6 },
  { label: "Mini valla", width: 4, height: 3.6 },
  { label: "Torre", width: 4, height: 7.5 },
  { label: "Unipolar", width: 15, height: 5 },
  { label: "Pasarela / Portal", width: 15, height: 2 },
] as const;

export type PrintPhase = "SETUP" | "PRINTING" | "COOLDOWN";

export const PHASE_LABELS: Record<PrintPhase, string> = {
  SETUP: "Set up",
  PRINTING: "Impresión",
  COOLDOWN: "Cooldown",
};

/** Solid fills for the bar segments; each phase reads as its own block. */
export const PHASE_FILLS: Record<PrintPhase, string> = {
  SETUP: "bg-amber-400/85",
  PRINTING: "bg-sky-500/90",
  COOLDOWN: "bg-slate-400/80",
};

export const PHASE_SWATCHES: Record<PrintPhase, string> = {
  SETUP: "bg-amber-400",
  PRINTING: "bg-sky-500",
  COOLDOWN: "bg-slate-400",
};

export const PRINT_JOB_STATUS_LABELS: Record<PrintJobStatus, string> = {
  SCHEDULED: "Agendado",
  SETUP: "En set up",
  PRINTING: "Imprimiendo",
  COOLDOWN: "En cooldown",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
};

export const PRINT_JOB_STATUS_STYLES: Record<PrintJobStatus, string> = {
  SCHEDULED: "bg-muted text-muted-foreground border-border",
  SETUP: "bg-amber-100 text-amber-900 border-amber-300",
  PRINTING: "bg-sky-100 text-sky-900 border-sky-300",
  COOLDOWN: "bg-slate-100 text-slate-900 border-slate-300",
  COMPLETED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-900 border-rose-300",
};

/** Monday-anchored week start, matching how the shop reads the calendar. */
export function startOfCalendarWeek(date: Date): Date {
  return startOfWeek(startOfDay(date), { weekStartsOn: 1 });
}

export function formatClock(date: Date | string): string {
  return format(new Date(date), "HH:mm");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "d MMM yyyy · HH:mm", { locale: es });
}

export function formatDay(date: Date | string): string {
  return format(new Date(date), "d 'de' MMMM", { locale: es });
}

export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatSize(
  width: number | null,
  height: number | null,
): string {
  if (width == null || height == null) return "Sin medidas";
  return `${trimNumber(width)} × ${trimNumber(height)} m`;
}

export function formatArea(areaM2: number): string {
  return trimNumber(Math.round(areaM2 * 100) / 100);
}

function trimNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(Math.round(value * 100) / 100);
}

/**
 * Puts an `HH:mm` time of day onto a calendar day, yielding a local instant.
 * Used by the job dialog, where the day and the time are separate controls.
 */
export function applyTimeToDate(
  date: Date | null | undefined,
  time: string,
): Date | null {
  if (!date || !time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}

export function toTimeInputValue(date: Date | string): string {
  return format(new Date(date), "HH:mm");
}

/** Keeps a free-text numeric field to digits only. */
export function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

/** Keeps a free-text numeric field to digits plus a single decimal separator. */
export function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length > 0
    ? `${whole.slice(0, 6)}.${rest.join("").slice(0, 2)}`
    : whole.slice(0, 6);
}

export function clampMinutes(value: string, min: number, max = 1440): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

/** Same as `clampMinutes` but keeps two decimals, for m² and m²/h fields. */
export function clampDecimal(value: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  const rounded = Math.round(parsed * 100) / 100;
  return Math.min(Math.max(rounded, min), max);
}

/** Phase segments of a job, in render order, skipping zero-length phases. */
export function jobSegments(
  job: Pick<PrintJob, "setupMinutes" | "printMinutes" | "cooldownMinutes">,
): { phase: PrintPhase; minutes: number }[] {
  return (
    [
      { phase: "SETUP" as const, minutes: job.setupMinutes },
      { phase: "PRINTING" as const, minutes: job.printMinutes },
      { phase: "COOLDOWN" as const, minutes: job.cooldownMinutes },
    ] satisfies { phase: PrintPhase; minutes: number }[]
  ).filter((segment) => segment.minutes > 0);
}

export function isJobLocked(status: PrintJobStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

export function jobTitle(job: PrintJob): string {
  return job.item.billboardCode ?? job.order.offerNumber;
}
