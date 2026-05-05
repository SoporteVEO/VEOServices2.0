"use client";

import { useMemo } from "react";
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
import { BarChart } from "@/components/ui/bar-chart";
import { formatMoney } from "@/lib/format";

import { formatCompactMoney, formatMonthLabel } from "./dashboard-utils";

import type { DashboardMonthlyTrend } from "@/api/billboards/billboards.get";

interface DashboardTrendChartProps {
  trend: DashboardMonthlyTrend[];
  isLoading: boolean;
}

const CHART_CONFIG = {
  estimatedRevenue: {
    label: "Ingresos estimados",
    color: "var(--chart-1)",
  },
  contractsStarted: {
    label: "Contratos nuevos",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function DashboardTrendChart({
  trend,
  isLoading,
}: DashboardTrendChartProps) {
  const { totalRevenue, totalContracts, peakRevenue } = useMemo(() => {
    let revenue = 0;
    let contracts = 0;
    let peak = 0;
    for (const t of trend) {
      revenue += t.estimatedRevenue;
      contracts += t.contractsStarted;
      if (t.estimatedRevenue > peak) peak = t.estimatedRevenue;
    }
    return { totalRevenue: revenue, totalContracts: contracts, peakRevenue: peak };
  }, [trend]);

  if (isLoading) {
    return (
      <Card size="sm" className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Tendencia mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Tendencia mensual</CardTitle>
            <CardDescription className="text-xs">
              Ingresos estimados y contratos iniciados por mes
            </CardDescription>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-3" />
            {formatMoney(totalRevenue)} · {totalContracts} contratos
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {trend.length === 0 ? (
          <EmptyState />
        ) : (
          <BarChart
            data={trend}
            config={CHART_CONFIG}
            xKey="monthKey"
            series={[{ dataKey: "estimatedRevenue" }]}
            xTickFormatter={(value) => formatMonthLabel(String(value))}
            yTickFormatter={(value) => formatCompactMoney(Number(value))}
            tooltipLabelFormatter={(label) => formatMonthLabel(String(label))}
            className="h-[260px]"
          />
        )}
        {peakRevenue > 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pico mensual: {formatMoney(peakRevenue)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
      Sin datos para el rango seleccionado
    </div>
  );
}
