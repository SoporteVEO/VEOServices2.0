"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { AreaChart, type AreaChartSeries } from "@/components/ui/area-chart";
import { BarChart, type BarChartSeries } from "@/components/ui/bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { cn } from "@/lib/utils";

import type {
  ReportsAnalyticsCoverageRow,
  ReportsAnalyticsOverview,
  ReportsAnalyticsTrendPoint,
} from "@/api/analytics/analytics.types";

const TYPE_CONFIG = {
  monthly: { label: "Mensual", color: "var(--chart-1)" },
  installation: { label: "Instalación", color: "var(--chart-3)" },
  maintenance: { label: "Mantenimiento", color: "var(--chart-4)" },
} satisfies ChartConfig;

const COVERAGE_CONFIG = {
  monthlyReportsSent: { label: "Enviados", color: "var(--chart-2)" },
  pending: { label: "Pendientes", color: "var(--chart-5)" },
} satisfies ChartConfig;

const STACKED_TYPE_SERIES: BarChartSeries<ReportsAnalyticsTrendPoint>[] = [
  { dataKey: "monthly", stackId: "type" },
  { dataKey: "installation", stackId: "type" },
  { dataKey: "maintenance", stackId: "type" },
];

const STACKED_AREA_SERIES: AreaChartSeries<ReportsAnalyticsTrendPoint>[] = [
  { dataKey: "monthly", type: "monotone", stackId: "type" },
  { dataKey: "installation", type: "monotone", stackId: "type" },
  { dataKey: "maintenance", type: "monotone", stackId: "type" },
];

type CoverageDatum = {
  shortLabel: string;
  monthlyReportsSent: number;
  pending: number;
  activeContracts: number;
  coverage: number;
};

const COVERAGE_SERIES: BarChartSeries<CoverageDatum>[] = [
  { dataKey: "monthlyReportsSent", stackId: "coverage" },
  { dataKey: "pending", stackId: "coverage" },
];

function parseDayKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function formatDayLabel(dateKey: string): string {
  return format(parseDayKey(dateKey), "d MMM", { locale: es });
}

function formatTooltipDay(dateKey: string): string {
  const raw = format(parseDayKey(dateKey), "EEEE d 'de' MMMM", { locale: es });
  return raw[0] ? raw[0].toUpperCase() + raw.slice(1) : raw;
}

function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const d = new Date(year, month - 1, 1);
  const raw = format(d, "MMM yyyy", { locale: es });
  return raw[0] ? raw[0].toUpperCase() + raw.slice(1) : raw;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return Math.round(value).toLocaleString("en-US");
}

function shortUserLabel(row: ReportsAnalyticsCoverageRow, maxLen = 18): string {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ");
  const base = name.trim() || row.email;
  if (base.length <= maxLen) return base;
  return `${base.slice(0, maxLen - 1)}…`;
}

interface ReportsAnalyticsChartsProps {
  overview?: ReportsAnalyticsOverview;
  isLoading: boolean;
}

export function ReportsAnalyticsCharts({
  overview,
  isLoading,
}: ReportsAnalyticsChartsProps) {
  if (isLoading || !overview) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[320px] w-full lg:col-span-2" />
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[320px] w-full lg:col-span-3" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <DailyTrendCard data={overview.daily} />
      <TypeDonutCard overview={overview} />
      <ComplianceChartCard overview={overview} />
      <MonthlyTrendCard data={overview.monthlyYear} />
    </div>
  );
}

function DailyTrendCard({ data }: { data: ReportsAnalyticsTrendPoint[] }) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.total, 0),
    [data],
  );

  return (
    <Card size="sm" className="border-border/80 shadow-none lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Reportes por día</CardTitle>
            <CardDescription className="text-xs">
              Volumen diario, separado por tipo de reporte
            </CardDescription>
          </div>
          <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            {total.toLocaleString("en-US")} reporte
            {total === 1 ? "" : "s"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyChart message="Sin reportes en el rango seleccionado" />
        ) : (
          <BarChart
            data={data}
            config={TYPE_CONFIG}
            xKey="key"
            series={STACKED_TYPE_SERIES}
            xTickFormatter={(value) => formatDayLabel(String(value))}
            yTickFormatter={(value) => formatCompactNumber(Number(value))}
            tooltipLabelFormatter={(label) => formatTooltipDay(String(label))}
            showLegend
            className="h-[280px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function MonthlyTrendCard({ data }: { data: ReportsAnalyticsTrendPoint[] }) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.total, 0),
    [data],
  );
  const year = data[0]?.key.slice(0, 4) ?? "";

  return (
    <Card size="sm" className="border-border/80 shadow-none lg:col-span-3">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">
              Tendencia mensual{year ? ` · ${year}` : ""}
            </CardTitle>
            <CardDescription className="text-xs">
              Reportes enviados por mes durante todo el año, separados por tipo
            </CardDescription>
          </div>
          <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {total.toLocaleString("en-US")} reporte
            {total === 1 ? "" : "s"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyChart message="Sin reportes este año" />
        ) : (
          <AreaChart
            data={data}
            config={TYPE_CONFIG}
            xKey="key"
            series={STACKED_AREA_SERIES}
            xTickFormatter={(value) => formatMonthLabel(String(value))}
            yTickFormatter={(value) => formatCompactNumber(Number(value))}
            tooltipLabelFormatter={(label) => formatMonthLabel(String(label))}
            showLegend
            className="h-[280px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function TypeDonutCard({ overview }: { overview: ReportsAnalyticsOverview }) {
  const slices = [
    { key: "monthly", value: overview.byType.monthly.count },
    { key: "installation", value: overview.byType.installation.count },
    { key: "maintenance", value: overview.byType.maintenance.count },
  ];
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const monthlyShare = total > 0 ? overview.byType.monthly.count / total : 0;

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">Distribución por tipo</CardTitle>
          <CardDescription className="text-xs">
            Mensual, instalación y mantenimiento en el rango
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {total > 0 ? (
          <DonutChart
            config={TYPE_CONFIG}
            slices={slices}
            innerRadius={64}
            centerValue={`${Math.round(monthlyShare * 100)}%`}
            centerLabel="Mensuales"
            className="h-[200px]"
          />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
            Sin reportes en el rango
          </div>
        )}
        <div className="grid w-full grid-cols-3 gap-2">
          <DonutLegend
            colorClassName="bg-[var(--chart-1)]"
            label="Mensual"
            value={overview.byType.monthly.count}
          />
          <DonutLegend
            colorClassName="bg-[var(--chart-3)]"
            label="Instalación"
            value={overview.byType.installation.count}
          />
          <DonutLegend
            colorClassName="bg-[var(--chart-4)]"
            label="Mantenimiento"
            value={overview.byType.maintenance.count}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DonutLegend({
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

function ComplianceChartCard({
  overview,
}: {
  overview: ReportsAnalyticsOverview;
}) {
  const { currentMonthCompliance } = overview;

  const chartData = useMemo<CoverageDatum[]>(() => {
    return currentMonthCompliance.perUser
      .slice(0, 12)
      .filter((row) => row.activeContracts > 0)
      .map((row) => ({
        shortLabel: shortUserLabel(row, 18),
        monthlyReportsSent: row.monthlyReportsSent,
        pending: row.pending,
        activeContracts: row.activeContracts,
        coverage: row.coverage,
      }));
  }, [currentMonthCompliance]);

  return (
    <Card size="sm" className="border-border/80 shadow-none lg:col-span-3">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">
              Reportes mensuales enviados vs requeridos
            </CardTitle>
            <CardDescription className="text-xs">
              Por cada usuario: reportes mensuales enviados en el rango
              seleccionado versus el número de contratos activos asignados que
              requieren reporte.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-medium text-emerald-600 dark:text-emerald-400">
              Enviados: {currentMonthCompliance.monthlyReportsSent}
            </span>
            <span className="rounded-md bg-rose-500/10 px-2 py-1 font-medium text-rose-600 dark:text-rose-400">
              Pendientes: {currentMonthCompliance.pending}
            </span>
            <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">
              Cobertura: {currentMonthCompliance.coverage.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyChart message="Sin contratos activos asignados a usuarios en el rango" />
        ) : (
          <BarChart
            data={chartData}
            config={COVERAGE_CONFIG}
            xKey="shortLabel"
            series={COVERAGE_SERIES}
            yTickFormatter={(value) => formatCompactNumber(Number(value))}
            tooltipLabelFormatter={(label, payload) => {
              const point = payload?.[0]?.payload;
              if (!point) return String(label);
              return `${label} · ${point.coverage.toFixed(1)}% cobertura`;
            }}
            showLegend
            className="h-[300px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}
