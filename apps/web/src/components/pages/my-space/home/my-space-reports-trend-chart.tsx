"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";

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
import { useMyReportsTrend } from "@/api/contracts/contracts.get";

import {
  formatCompactNumber,
  formatMonthLabel,
  yearRangeIso,
} from "./my-space-home-utils";
import { YearSelect } from "./year-select";

const CHART_CONFIG = {
  monthly: {
    label: "Mensual",
    color: "var(--chart-1)",
  },
  installation: {
    label: "Instalación",
    color: "var(--chart-3)",
  },
  maintenance: {
    label: "Mantenimiento",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function MySpaceReportsTrendChart() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const range = useMemo(() => yearRangeIso(year), [year]);

  const { data: reports, isLoading } = useMyReportsTrend({
    from: range.from,
    to: range.to,
  });

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Reportes enviados por mes</CardTitle>
            <CardDescription className="text-xs">
              Mensuales, instalación y mantenimiento durante el año seleccionado
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <YearSelect value={year} onChange={setYear} />
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ClipboardCheck className="size-3" />
              {reports?.totals.total ?? 0}
            </span>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <SummaryStat
            label="Mensual"
            value={reports?.totals.monthly ?? 0}
            colorVar="var(--chart-1)"
          />
          <SummaryStat
            label="Instalación"
            value={reports?.totals.installation ?? 0}
            colorVar="var(--chart-3)"
          />
          <SummaryStat
            label="Mantenimiento"
            value={reports?.totals.maintenance ?? 0}
            colorVar="var(--chart-4)"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !reports ? (
          <Skeleton className="h-64 w-full" />
        ) : reports.trend.length === 0 || reports.totals.total === 0 ? (
          <EmptyState />
        ) : (
          <BarChart
            data={reports.trend}
            config={CHART_CONFIG}
            xKey="monthKey"
            series={[
              { dataKey: "monthly", stackId: "type" },
              { dataKey: "installation", stackId: "type" },
              { dataKey: "maintenance", stackId: "type" },
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

function SummaryStat({
  label,
  value,
  colorVar,
}: {
  label: string;
  value: number;
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
        {value.toLocaleString("en-US")}
      </span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
      Sin reportes enviados en el año seleccionado
    </div>
  );
}
