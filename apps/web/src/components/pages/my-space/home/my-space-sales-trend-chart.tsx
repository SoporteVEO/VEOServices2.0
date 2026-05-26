"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { AreaChart } from "@/components/ui/area-chart";
import { useMyOffersSummary } from "@/api/offers/offers.get";
import { formatMoney } from "@/lib/format";

import {
  formatCompactMoney,
  formatMonthLabel,
  yearRangeIso,
} from "./my-space-home-utils";
import { YearSelect } from "./year-select";

const CHART_CONFIG = {
  acceptedAmount: {
    label: "Ventas (aceptadas)",
    color: "var(--chart-2)",
  },
  pendingAmount: {
    label: "Pendiente",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function MySpaceSalesTrendChart() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const range = useMemo(() => yearRangeIso(year), [year]);

  const { data, isLoading } = useMyOffersSummary({
    from: range.from,
    to: range.to,
  });

  const trend = data?.trend ?? [];

  const totals = useMemo(() => {
    let accepted = 0;
    let pending = 0;
    for (const t of trend) {
      accepted += t.acceptedAmount;
      pending += t.pendingAmount;
    }
    return { accepted, pending };
  }, [trend]);

  const hasData = trend.some(
    (t) => t.acceptedAmount > 0 || t.pendingAmount > 0,
  );

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Ventas por mes</CardTitle>
            <CardDescription className="text-xs">
              Monto de cotizaciones aceptadas y pendientes (renta + impresión)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <YearSelect value={year} onChange={setYear} />
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-3" />
              {formatMoney(totals.accepted)}
            </span>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <SummaryStat
            label="Aceptado"
            value={formatMoney(totals.accepted)}
            colorVar="var(--chart-2)"
          />
          <SummaryStat
            label="Pendiente"
            value={formatMoney(totals.pending)}
            colorVar="var(--chart-4)"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <AreaChart
            data={trend}
            config={CHART_CONFIG}
            xKey="monthKey"
            series={[
              { dataKey: "pendingAmount", type: "monotone" },
              { dataKey: "acceptedAmount", type: "monotone" },
            ]}
            xTickFormatter={(value) => formatMonthLabel(String(value))}
            yTickFormatter={(value) => formatCompactMoney(Number(value))}
            tooltipLabelFormatter={(label) => formatMonthLabel(String(label))}
            tooltipValueFormatter={(value) => formatMoney(Number(value))}
            showLegend
            className="h-[260px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  colorVar,
}: {
  label: string;
  value: string;
  colorVar: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: colorVar }}
      />
      <span>{label}:</span>
      <span className="font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
      Sin ventas en el año seleccionado
    </div>
  );
}
