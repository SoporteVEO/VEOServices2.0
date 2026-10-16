import { format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  PersonSummary,
  PrintRescheduleStatus,
  PrintScheduleStatus,
  ProductionOrder,
  ProductionOrderItem,
} from "@/api/production-orders/production-orders.types";

export const PRINT_SCHEDULE_STATUS_LABELS: Record<PrintScheduleStatus, string> =
  {
    SCHEDULED: "Agendada",
    SETUP: "En set up",
    PRINTING: "Imprimiendo",
    COOLDOWN: "En cooldown",
    COMPLETED: "Impresa",
  };

export const PRINT_SCHEDULE_STATUS_STYLES: Record<PrintScheduleStatus, string> =
  {
    SCHEDULED:
      "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    SETUP:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    PRINTING:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    COOLDOWN:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    COMPLETED:
      "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };

export const RESCHEDULE_STATUS_LABELS: Record<PrintRescheduleStatus, string> = {
  PENDING: "Reprogramación solicitada",
  RESOLVED: "Reprogramación atendida",
  REJECTED: "Reprogramación rechazada",
  CANCELLED: "Solicitud retirada",
};

export const RESCHEDULE_STATUS_STYLES: Record<PrintRescheduleStatus, string> = {
  PENDING:
    "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  RESOLVED:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
  CANCELLED:
    "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export function formatPrintDay(value: string | Date): string {
  const raw = format(new Date(value), "EEEE d 'de' MMMM yyyy", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatPrintShortDay(value: string | Date): string {
  return format(new Date(value), "d MMM yyyy", { locale: es });
}

export function formatPrintClock(value: string | Date): string {
  return format(new Date(value), "HH:mm");
}

export function formatPrintMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatPersonName(person: PersonSummary): string {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

/** Whether the salesperson can still ask production to move this print. */
export function canRequestReschedule(item: ProductionOrderItem): boolean {
  if (item.status === "CANCELLED" || item.status === "COMPLETED") return false;
  if (item.printSchedule && item.printSchedule.status !== "SCHEDULED") {
    return false;
  }
  return item.latestRescheduleRequest?.status !== "PENDING";
}

export interface OrderPrintSummary {
  printableCount: number;
  scheduledCount: number;
  printedCount: number;
  /** Earliest start among billboards still waiting for the press. */
  nextStartAt: string | null;
  pendingRequestCount: number;
}

export function summarizeOrderPrintSchedule(
  order: ProductionOrder,
): OrderPrintSummary {
  const printable = order.items.filter((item) => item.status !== "CANCELLED");
  let nextStartAt: string | null = null;
  let scheduledCount = 0;
  let printedCount = 0;
  let pendingRequestCount = 0;

  for (const item of printable) {
    if (item.latestRescheduleRequest?.status === "PENDING") {
      pendingRequestCount += 1;
    }
    const schedule = item.printSchedule;
    if (!schedule) continue;
    scheduledCount += 1;
    if (schedule.status === "COMPLETED") {
      printedCount += 1;
      continue;
    }
    if (!nextStartAt || schedule.scheduledStartAt < nextStartAt) {
      nextStartAt = schedule.scheduledStartAt;
    }
  }

  return {
    printableCount: printable.length,
    scheduledCount,
    printedCount,
    nextStartAt,
    pendingRequestCount,
  };
}
