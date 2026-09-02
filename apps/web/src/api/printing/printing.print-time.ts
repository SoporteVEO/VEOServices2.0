import type { PrintJob, PrintingMachine } from "./printing.types";

const MINUTES_PER_HOUR = 60;

/** Mirrors the API's fallback for panels with no recorded dimensions. */
export const FALLBACK_PRINT_MINUTES = 45;

/**
 * How long `areaM2` occupies a press running at `speedM2PerHour`. Kept in step
 * with the server's `computePrintMinutes` so a previewed duration matches the
 * one the schedule comes back with.
 */
export function computePrintMinutes(
  areaM2: number,
  speedM2PerHour: number,
): number {
  if (!Number.isFinite(areaM2) || areaM2 <= 0) return FALLBACK_PRINT_MINUTES;
  if (!Number.isFinite(speedM2PerHour) || speedM2PerHour <= 0) {
    return FALLBACK_PRINT_MINUTES;
  }
  return Math.max(1, Math.ceil((areaM2 / speedM2PerHour) * MINUTES_PER_HOUR));
}

/** Total minutes a job of this area books on a machine, phases included. */
export function computeJobMinutes(
  areaM2: number,
  machine: Pick<
    PrintingMachine,
    "setupMinutes" | "cooldownMinutes" | "printSpeedM2PerHour"
  >,
): { setupMinutes: number; printMinutes: number; cooldownMinutes: number } {
  return {
    setupMinutes: machine.setupMinutes,
    printMinutes: computePrintMinutes(areaM2, machine.printSpeedM2PerHour),
    cooldownMinutes: machine.cooldownMinutes,
  };
}

export interface DailyCapacity {
  usedM2: number;
  limitM2: number;
  remainingM2: number;
  /** 0-1, and above 1 once the day is oversubscribed. */
  ratio: number;
}

/**
 * Area already committed on a machine for the local day containing `day`.
 * Cancelled jobs release their capacity; everything else - finished work
 * included - has consumed it.
 */
export function dailyCapacityFor(
  machine: Pick<PrintingMachine, "id" | "dailyCapacityM2">,
  jobs: PrintJob[],
  day: Date,
): DailyCapacity {
  const usedM2 = jobs.reduce((total, job) => {
    if (job.machineId !== machine.id) return total;
    if (job.status === "CANCELLED") return total;
    return isSameLocalDay(new Date(job.scheduledStartAt), day)
      ? total + job.areaM2
      : total;
  }, 0);

  const limitM2 = machine.dailyCapacityM2;
  return {
    usedM2: round2(usedM2),
    limitM2,
    remainingM2: round2(Math.max(0, limitM2 - usedM2)),
    ratio: limitM2 > 0 ? usedM2 / limitM2 : 0,
  };
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
