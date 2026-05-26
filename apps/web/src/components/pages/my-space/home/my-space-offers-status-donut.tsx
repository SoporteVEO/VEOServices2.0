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

import type { MyOffersSummary } from "@/api/offers/offers.types";

interface MySpaceOffersStatusDonutProps {
  offers?: MyOffersSummary;
  isLoading: boolean;
}

const CHART_CONFIG = {
  accepted: {
    label: "Aceptadas",
    color: "var(--chart-2)",
  },
  pending: {
    label: "Pendientes",
    color: "var(--chart-4)",
  },
  declined: {
    label: "Rechazadas",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function MySpaceOffersStatusDonut({
  offers,
  isLoading,
}: MySpaceOffersStatusDonutProps) {
  if (isLoading || !offers) {
    return (
      <Card size="sm" className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Estado de cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-44 w-full" />
        </CardContent>
      </Card>
    );
  }

  const slices = [
    { key: "accepted", value: offers.byStatus.accepted.count },
    { key: "pending", value: offers.byStatus.pending.count },
    { key: "declined", value: offers.byStatus.declined.count },
  ];
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const acceptedRate = total > 0 ? offers.byStatus.accepted.count / total : 0;

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">Estado de cotizaciones</CardTitle>
          <CardDescription className="text-xs">
            Distribución por estado en el rango
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {total > 0 ? (
          <DonutChart
            config={CHART_CONFIG}
            slices={slices}
            innerRadius={64}
            centerValue={`${Math.round(acceptedRate * 100)}%`}
            centerLabel="Aceptación"
            className="h-[200px]"
          />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
            Sin cotizaciones en el rango
          </div>
        )}
        <div className="grid w-full grid-cols-3 gap-2">
          <Stat
            colorClassName="bg-[var(--chart-2)]"
            label="Aceptadas"
            value={offers.byStatus.accepted.count}
          />
          <Stat
            colorClassName="bg-[var(--chart-4)]"
            label="Pendientes"
            value={offers.byStatus.pending.count}
          />
          <Stat
            colorClassName="bg-[var(--chart-5)]"
            label="Rechazadas"
            value={offers.byStatus.declined.count}
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
    <div className="flex flex-col items-center gap-0.5 rounded-md border bg-accent/10 px-2 py-1.5">
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
