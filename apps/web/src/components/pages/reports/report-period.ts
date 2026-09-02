/** How far back the month selector lets users go. */
export const REPORT_MONTHS_BACK = 23;

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/** Last instant of the month, for inclusive ranges such as the PPT period. */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

/** Stable `YYYY-MM` identifier, safe to use as a select value or React key. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthFromKey(key: string): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function formatMonthLabel(date: Date): string {
  const label = date.toLocaleDateString("es-SV", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Selectable months, newest first, ending at the current month. */
export function buildMonthOptions(reference: Date = new Date()): Date[] {
  const current = startOfMonth(reference);
  return Array.from({ length: REPORT_MONTHS_BACK + 1 }, (_, index) =>
    addMonths(current, -index),
  );
}
