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

import type { MyContractsSnapshot } from "@/api/contracts/contracts.get";

interface MySpaceContractsCoverageDonutProps {
  contracts?: MyContractsSnapshot;
  isLoading: boolean;
}

const CHART_CONFIG = {
  sent: {
    label: "Reportados",
    color: "var(--chart-2)",
  },
  pending: {
    label: "Pendientes",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function MySpaceContractsCoverageDonut({
  contracts,
  isLoading,
}: MySpaceContractsCoverageDonutProps) {
  if (isLoading || !contracts) {
    return (
      <Card size="sm" className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Cobertura mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-44 w-full" />
        </CardContent>
      </Card>
    );
  }

  const slices = [
    { key: "sent", value: contracts.reportsSentThisMonth },
    { key: "pending", value: contracts.reportsPendingThisMonth },
  ];
  const total = contracts.activeCount;
  const coverage = total > 0 ? contracts.reportsSentThisMonth / total : 0;

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">Cobertura mensual</CardTitle>
          <CardDescription className="text-xs">
            Reportes mensuales enviados vs contratos activos
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {total > 0 ? (
          <DonutChart
            config={CHART_CONFIG}
            slices={slices}
            innerRadius={64}
            centerValue={`${Math.round(coverage * 100)}%`}
            centerLabel="Cobertura"
            className="h-[200px]"
          />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
            Sin contratos activos
          </div>
        )}
        <div className="grid w-full grid-cols-2 gap-2">
          <Stat
            colorClassName="bg-[var(--chart-2)]"
            label="Reportados"
            value={contracts.reportsSentThisMonth}
          />
          <Stat
            colorClassName="bg-[var(--chart-4)]"
            label="Pendientes"
            value={contracts.reportsPendingThisMonth}
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
