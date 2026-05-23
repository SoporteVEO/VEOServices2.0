import type { SalesByCostCenterRow } from "@/api/analytics/analytics.types";

export type SalesAggregate = {
  key: string;
  label: string;
  total: number;
  count: number;
  uniqueInvoices: number;
  uniqueCustomers: number;
};

export function aggregateSalesBy(
  rows: SalesByCostCenterRow[],
  pick: (row: SalesByCostCenterRow) => {
    key: string | number | null;
    label: string;
  },
): SalesAggregate[] {
  const map = new Map<
    string,
    SalesAggregate & {
      invoiceIds: Set<number>;
      customerNames: Set<string>;
    }
  >();
  for (const row of rows) {
    const { key, label } = pick(row);
    const safeKey = String(key ?? "none");
    const existing = map.get(safeKey);
    if (existing) {
      existing.total += row.total;
      existing.count += 1;
      existing.invoiceIds.add(row.invoiceId);
      existing.customerNames.add(row.customerName);
    } else {
      map.set(safeKey, {
        key: safeKey,
        label,
        total: row.total,
        count: 1,
        uniqueInvoices: 0,
        uniqueCustomers: 0,
        invoiceIds: new Set([row.invoiceId]),
        customerNames: new Set([row.customerName]),
      });
    }
  }
  return Array.from(map.values())
    .map((a) => ({
      key: a.key,
      label: a.label,
      total: a.total,
      count: a.count,
      uniqueInvoices: a.invoiceIds.size,
      uniqueCustomers: a.customerNames.size,
    }))
    .sort((a, b) => b.total - a.total);
}

export function formatCompactMoney(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
}

export function formatFullMoney(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatRangeLabel(from: string, to: string): string {
  const fmt = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d) return s;
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  };
  return `${fmt(from)} – ${fmt(to)}`;
}

export function topChartSeries(
  items: SalesAggregate[],
  maxItems: number,
): { label: string; value: number }[] {
  if (items.length <= maxItems) {
    return items.map((i) => ({ label: i.label, value: Math.abs(i.total) }));
  }
  const top = items.slice(0, maxItems);
  const rest = items.slice(maxItems);
  const othersTotal = rest.reduce((sum, i) => sum + Math.abs(i.total), 0);
  const series = top.map((i) => ({ label: i.label, value: Math.abs(i.total) }));
  if (othersTotal > 0) {
    series.push({ label: "Otros", value: othersTotal });
  }
  return series;
}

export const EXECUTIVE_CHART_COLORS = [
  "#10b981",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#1e40af",
  "#06b6d4",
  "#f97316",
] as const;

export function daysInRange(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}
