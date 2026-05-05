import type { BillboardContractHistoryItem } from "@/api/billboards/billboards.get";

export type ContractRange = {
  start: Date;
  end: Date;
};

export type BillboardOccupancySummary = {
  totalContracts: number;
  totalRevenue: number;
  totalOccupiedDays: number;
  uniqueCustomers: number;
  lastContractEnd: Date | null;
  nextAvailableDate: Date | null;
  isCurrentlyOccupied: boolean;
};

export function parseContractDate(value: string): Date {
  return new Date(value);
}

export function getContractRanges(
  contracts: BillboardContractHistoryItem[],
): ContractRange[] {
  return contracts
    .map((c) => ({
      start: parseContractDate(c.startDate),
      end: parseContractDate(c.endDate),
    }))
    .filter((r) => !isNaN(r.start.getTime()) && !isNaN(r.end.getTime()))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function summarizeContracts(
  contracts: BillboardContractHistoryItem[],
): BillboardOccupancySummary {
  const ranges = getContractRanges(contracts);
  const now = new Date();

  let totalRevenue = 0;
  let totalOccupiedDays = 0;
  const customers = new Set<string>();

  for (const c of contracts) {
    if (c.price != null) totalRevenue += c.price;
    if (c.customerName) customers.add(c.customerName);
  }

  for (const r of ranges) {
    const days = Math.max(
      0,
      Math.ceil((r.end.getTime() - r.start.getTime()) / 86_400_000) + 1,
    );
    totalOccupiedDays += days;
  }

  const sortedByEnd = [...ranges].sort(
    (a, b) => b.end.getTime() - a.end.getTime(),
  );
  const lastContractEnd = sortedByEnd[0]?.end ?? null;

  const futureRanges = ranges
    .filter((r) => r.end >= now)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const isCurrentlyOccupied = ranges.some(
    (r) => r.start <= now && r.end >= now,
  );

  let nextAvailableDate: Date | null = null;
  if (isCurrentlyOccupied) {
    const activeContract = ranges.find((r) => r.start <= now && r.end >= now);
    if (activeContract) {
      let cursor = new Date(activeContract.end.getTime() + 86_400_000);
      const sortedFuture = [...futureRanges].sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      );
      let extended = true;
      while (extended) {
        extended = false;
        for (const f of sortedFuture) {
          if (f.start <= cursor && f.end >= cursor) {
            cursor = new Date(f.end.getTime() + 86_400_000);
            extended = true;
          }
        }
      }
      nextAvailableDate = cursor;
    }
  }

  return {
    totalContracts: contracts.length,
    totalRevenue,
    totalOccupiedDays,
    uniqueCustomers: customers.size,
    lastContractEnd,
    nextAvailableDate,
    isCurrentlyOccupied,
  };
}

export type MonthOccupancy = {
  monthIndex: number;
  monthLabel: string;
  daysInMonth: number;
  occupiedDays: number;
  occupancyPercent: number;
  contractsCount: number;
};

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function getYearOccupancy(
  contracts: BillboardContractHistoryItem[],
  year: number,
): MonthOccupancy[] {
  const ranges = getContractRanges(contracts);
  const result: MonthOccupancy[] = [];

  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(year, m, 1);
    const monthEnd = new Date(year, m + 1, 0);
    const daysInMonth = monthEnd.getDate();

    const occupiedDayKeys = new Set<number>();
    let contractsCount = 0;

    for (const r of ranges) {
      if (r.end < monthStart || r.start > monthEnd) continue;
      contractsCount++;
      const overlapStart = r.start < monthStart ? monthStart : r.start;
      const overlapEnd = r.end > monthEnd ? monthEnd : r.end;
      const startDay = overlapStart.getDate();
      const endDay = overlapEnd.getDate();
      for (let d = startDay; d <= endDay; d++) {
        occupiedDayKeys.add(d);
      }
    }

    const occupiedDays = occupiedDayKeys.size;
    const occupancyPercent =
      daysInMonth > 0 ? Math.round((occupiedDays / daysInMonth) * 100) : 0;

    result.push({
      monthIndex: m,
      monthLabel: MONTH_LABELS[m]!,
      daysInMonth,
      occupiedDays,
      occupancyPercent,
      contractsCount,
    });
  }

  return result;
}

export function getAvailableYears(
  contracts: BillboardContractHistoryItem[],
): number[] {
  const ranges = getContractRanges(contracts);
  const years = new Set<number>();
  const currentYear = new Date().getFullYear();
  years.add(currentYear);
  years.add(currentYear + 1);
  for (const r of ranges) {
    for (let y = r.start.getFullYear(); y <= r.end.getFullYear(); y++) {
      years.add(y);
    }
  }
  return [...years].sort((a, b) => b - a);
}

export function calculateContractDurationDays(
  start: Date,
  end: Date,
): number {
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1);
}
