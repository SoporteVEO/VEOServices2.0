"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Badge } from "@/components/primitives/ui/badge";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { AreaChart } from "@/components/ui/area-chart";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

import { formatCompactMoney, formatMonthLabel } from "./dashboard-utils";

import type { DashboardYoyTrend } from "@/api/billboards/billboards.get";

interface DashboardYoyChartProps {
  yoy: DashboardYoyTrend[];
  isLoading: boolean;
}

const CHART_CONFIG = {
  current: {
    label: "Este año",
    color: "var(--chart-1)",
  },
  previous: {
    label: "Año anterior",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function DashboardYoyChart({ yoy, isLoading }: DashboardYoyChartProps) {
  const summary = useMemo(() => {
    let current = 0;
    let previous = 0;
    for (const t of yoy) {
      current += t.current;
      previous += t.previous;
    }
    const delta = current - previous;
    const deltaPct = previous > 0 ? delta / previous : null;
    return { current, previous, delta, deltaPct };
  }, [yoy]);

  if (isLoading) {
    return (
      <Card size="sm" className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Año contra año</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isUp = summary.delta >= 0;

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Año contra año</CardTitle>
            <CardDescription className="text-xs">
              Ingresos estimados comparados con el mismo periodo del año
              anterior
            </CardDescription>
          </div>
          {summary.previous > 0 ? (
            <Badge
              className={cn(
                "h-6 gap-1 border-transparent text-[11px] font-medium",
                isUp
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
              )}
            >
              {isUp ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {summary.deltaPct != null
                ? `${(summary.deltaPct * 100).toFixed(1)}%`
                : "—"}
            </Badge>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <SummaryStat
            label="Este año"
            value={formatMoney(summary.current)}
            colorVar="var(--chart-1)"
          />
          <SummaryStat
            label="Año anterior"
            value={formatMoney(summary.previous)}
            colorVar="var(--chart-3)"
          />
          {summary.previous > 0 ? (
            <SummaryStat
              label="Diferencia"
              value={formatMoney(Math.abs(summary.delta))}
              tone={isUp ? "emerald" : "rose"}
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {yoy.length === 0 ? (
          <EmptyState />
        ) : (
          <AreaChart
            data={yoy}
            config={CHART_CONFIG}
            xKey="monthKey"
            series={[
              { dataKey: "previous", type: "monotone" },
              { dataKey: "current", type: "monotone" },
            ]}
            xTickFormatter={(value) => formatMonthLabel(String(value))}
            yTickFormatter={(value) => formatCompactMoney(Number(value))}
            tooltipLabelFormatter={(label) => formatMonthLabel(String(label))}
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
  tone,
}: {
  label: string;
  value: string;
  colorVar?: string;
  tone?: "emerald" | "rose";
}) {
  return (
    <span className="flex items-center gap-1.5">
      {colorVar ? (
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: colorVar }}
        />
      ) : null}
      <span>{label}:</span>
      <span
        className={cn(
          "font-semibold tabular-nums text-foreground",
          tone === "emerald" && "text-emerald-600 dark:text-emerald-400",
          tone === "rose" && "text-rose-600 dark:text-rose-400",
        )}
      >
        {value}
      </span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
      Sin datos para comparar
    </div>
  );
}
