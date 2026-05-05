"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { cn } from "@/lib/utils";

import { formatPercent } from "./dashboard-utils";

import type { DashboardKpis } from "@/api/billboards/billboards.get";

interface DashboardAvailabilityDonutProps {
  kpis: DashboardKpis | undefined;
  isLoading: boolean;
}

const CHART_CONFIG = {
  occupied: {
    label: "Ocupadas",
    color: "var(--chart-1)",
  },
  available: {
    label: "Disponibles",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function DashboardAvailabilityDonut({
  kpis,
  isLoading,
}: DashboardAvailabilityDonutProps) {
  if (isLoading || !kpis) {
    return (
      <Card size="sm" className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Disponibilidad</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-44 w-full" />
        </CardContent>
      </Card>
    );
  }

  const slices = [
    { key: "occupied", value: kpis.occupiedBillboards },
    { key: "available", value: kpis.availableBillboards },
  ];
  const hasData = slices.some((s) => s.value > 0);

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">Disponibilidad</CardTitle>
          <CardDescription className="text-xs">
            Estado del inventario en el rango
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {hasData ? (
          <DonutChart
            config={CHART_CONFIG}
            slices={slices}
            innerRadius={64}
            centerValue={formatPercent(kpis.occupancyRate, 0)}
            centerLabel="Ocupación"
            className="h-[200px]"
          />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
            Sin datos
          </div>
        )}
        <div className="grid w-full grid-cols-2 gap-2">
          <Stat
            colorClassName="bg-[var(--chart-1)]"
            label="Ocupadas"
            value={kpis.occupiedBillboards}
          />
          <Stat
            colorClassName="bg-[var(--chart-3)]"
            label="Disponibles"
            value={kpis.availableBillboards}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  colorClassName,
  label,
  value,
}: {
  colorClassName: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-accent/10 px-2.5 py-1.5">
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className={cn("size-2 rounded-full", colorClassName)} />
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">
        {value.toLocaleString("en-US")}
      </span>
    </div>
  );
}
