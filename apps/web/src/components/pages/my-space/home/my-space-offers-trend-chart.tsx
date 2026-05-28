"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";

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
import { useMyOffersSummary } from "@/api/offers/offers.get";
import { useMySpaceViewAs } from "../my-space-view-as-context";

import {
  formatCompactNumber,
  formatMonthLabel,
  yearRangeIso,
} from "./my-space-home-utils";
import { YearSelect } from "./year-select";

const CHART_CONFIG = {
  pending: {
    label: "Pendientes",
    color: "var(--chart-4)",
  },
  accepted: {
    label: "Aceptadas",
    color: "var(--chart-2)",
  },
  declined: {
    label: "Rechazadas",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function MySpaceOffersTrendChart() {
  const { viewAsUserId } = useMySpaceViewAs();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const range = useMemo(() => yearRangeIso(year), [year]);

  const { data, isLoading } = useMyOffersSummary({
    from: range.from,
    to: range.to,
    viewAsUserId,
  });

  const trend = data?.trend ?? [];
  const totalOffers = data?.totals.count ?? 0;

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Cotizaciones por mes</CardTitle>
            <CardDescription className="text-xs">
              Distribución por estado durante el año seleccionado
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <YearSelect value={year} onChange={setYear} />
            <span className="flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
              <FileText className="size-3" />
              {totalOffers}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : trend.length === 0 || totalOffers === 0 ? (
          <EmptyState />
        ) : (
          <BarChart
            data={trend}
            config={CHART_CONFIG}
            xKey="monthKey"
            series={[
              { dataKey: "accepted", stackId: "status" },
              { dataKey: "pending", stackId: "status" },
              { dataKey: "declined", stackId: "status" },
            ]}
            xTickFormatter={(value) => formatMonthLabel(String(value))}
            yTickFormatter={(value) => formatCompactNumber(Number(value))}
            tooltipLabelFormatter={(label) => formatMonthLabel(String(label))}
            showLegend
            className="h-[260px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
      Sin cotizaciones en el año seleccionado
    </div>
  );
}
