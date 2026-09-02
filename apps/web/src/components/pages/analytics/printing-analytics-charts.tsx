"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { AreaChart } from "@/components/ui/area-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";

import type {
  PrintingAnalyticsDailyPoint,
  PrintingAnalyticsHourPoint,
  PrintingAnalyticsMachineRow,
  PrintingAnalyticsOverview,
  PrintingAnalyticsSizeRow,
} from "@/api/analytics/analytics.types";

const PHASE_CONFIG: ChartConfig = {
  setupHours: { label: "Set up", color: "var(--chart-3)" },
  printHours: { label: "Impresión", color: "var(--chart-1)" },
  cooldownHours: { label: "Cooldown", color: "var(--chart-4)" },
};

const PLAN_VS_ACTUAL_CONFIG: ChartConfig = {
  plannedHours: { label: "Planificado", color: "var(--chart-2)" },
  actualHours: { label: "Real", color: "var(--chart-1)" },
};

const HOUR_CONFIG: ChartConfig = {
  jobsStarted: { label: "Trabajos iniciados", color: "var(--chart-1)" },
};

const SIZE_CONFIG: ChartConfig = {
  avgPlannedPrintMinutes: { label: "Plan (min)", color: "var(--chart-2)" },
  avgActualPrintMinutes: { label: "Real (min)", color: "var(--chart-1)" },
};

const MACHINE_CONFIG: ChartConfig = {
  utilization: { label: "Uso (%)", color: "var(--chart-1)" },
};

const PHASE_SERIES = [
  { dataKey: "setupHours" as const, stackId: "phases" },
  { dataKey: "printHours" as const, stackId: "phases" },
  { dataKey: "cooldownHours" as const, stackId: "phases" },
];

const PLAN_VS_ACTUAL_SERIES = [
  { dataKey: "plannedHours" as const },
  { dataKey: "actualHours" as const },
];

const HOUR_SERIES = [{ dataKey: "jobsStarted" as const, radius: 3 as const }];

const SIZE_SERIES = [
  { dataKey: "avgPlannedPrintMinutes" as const },
  { dataKey: "avgActualPrintMinutes" as const },
];

const MACHINE_SERIES = [
  { dataKey: "utilization" as const, radius: 4 as const },
];

interface Props {
  overview?: PrintingAnalyticsOverview;
  isLoading: boolean;
}

export function PrintingAnalyticsCharts({ overview, isLoading }: Props) {
  if (isLoading || !overview) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[320px] w-full lg:col-span-2" />
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[320px] w-full lg:col-span-2" />
        <Skeleton className="h-[320px] w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <DailyPhaseCard data={overview.daily} />
      <PhaseSplitCard phaseSplit={overview.phaseSplit} />
      <PlanVsActualCard data={overview.daily} />
      <MachineUtilizationCard data={overview.byMachine} />
      <HourOfDayCard data={overview.byHour} />
      <SizeAccuracyCard data={overview.bySize} />
    </div>
  );
}

function DailyPhaseCard({ data }: { data: PrintingAnalyticsDailyPoint[] }) {
  const total = useMemo(
    () => data.reduce((sum, point) => sum + point.actualHours, 0),
    [data],
  );

  return (
    <Card size="sm" className="border-border/80 shadow-none lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Horas de máquina por día</CardTitle>
            <CardDescription className="text-xs">
              Tiempo real de set up, impresión y cooldown
            </CardDescription>
          </div>
          <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            {formatHours(total)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyChart message="Sin actividad registrada en el rango" />
        ) : (
          <BarChart
            data={data}
            config={PHASE_CONFIG}
            xKey="dateKey"
            series={PHASE_SERIES}
            xTickFormatter={(value) => formatDayTick(String(value))}
            yTickFormatter={(value) => `${value}h`}
            tooltipLabelFormatter={(label) => formatDayFull(String(label))}
            tooltipValueFormatter={(value) => formatHours(Number(value))}
            showLegend
            className="h-[280px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function PhaseSplitCard({
  phaseSplit,
}: {
  phaseSplit: PrintingAnalyticsOverview["phaseSplit"];
}) {
  const slices = [
    { key: "printHours", value: phaseSplit.printHours },
    { key: "setupHours", value: phaseSplit.setupHours },
    { key: "cooldownHours", value: phaseSplit.cooldownHours },
  ];
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const printShare = total > 0 ? phaseSplit.printHours / total : 0;

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">Distribución del tiempo</CardTitle>
          <CardDescription className="text-xs">
            Cuánto del tiempo de máquina se dedica a imprimir
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {total === 0 ? (
          <EmptyChart message="Sin tiempos registrados" />
        ) : (
          <DonutChart
            config={PHASE_CONFIG}
            slices={slices}
            centerValue={`${Math.round(printShare * 100)}%`}
            centerLabel="Impresión"
            className="h-[260px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function PlanVsActualCard({ data }: { data: PrintingAnalyticsDailyPoint[] }) {
  const total = useMemo(
    () => data.reduce((sum, point) => sum + point.plannedHours, 0),
    [data],
  );

  return (
    <Card size="sm" className="border-border/80 shadow-none lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Planificado vs. real</CardTitle>
            <CardDescription className="text-xs">
              Horas reservadas en el calendario contra horas trabajadas
            </CardDescription>
          </div>
          <span className="rounded-md bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
            {formatHours(total)} planificadas
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyChart message="Sin trabajos agendados en el rango" />
        ) : (
          <AreaChart
            data={data}
            config={PLAN_VS_ACTUAL_CONFIG}
            xKey="dateKey"
            series={PLAN_VS_ACTUAL_SERIES}
            xTickFormatter={(value) => formatDayTick(String(value))}
            yTickFormatter={(value) => `${value}h`}
            tooltipLabelFormatter={(label) => formatDayFull(String(label))}
            tooltipValueFormatter={(value) => formatHours(Number(value))}
            showLegend
            className="h-[280px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function MachineUtilizationCard({
  data,
}: {
  data: PrintingAnalyticsMachineRow[];
}) {
  const hasData = data.some((row) => row.utilization > 0);

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">Uso por máquina</CardTitle>
          <CardDescription className="text-xs">
            Porcentaje del rango en que cada máquina estuvo ocupada
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyChart message="Sin uso registrado" />
        ) : (
          <BarChart
            data={data}
            config={MACHINE_CONFIG}
            xKey="machineName"
            series={MACHINE_SERIES}
            yTickFormatter={(value) => `${value}%`}
            tooltipValueFormatter={(value) => `${Number(value)}%`}
            className="h-[260px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function HourOfDayCard({ data }: { data: PrintingAnalyticsHourPoint[] }) {
  const total = useMemo(
    () => data.reduce((sum, point) => sum + point.jobsStarted, 0),
    [data],
  );

  return (
    <Card size="sm" className="border-border/80 shadow-none lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Horas más ocupadas</CardTitle>
            <CardDescription className="text-xs">
              Trabajos iniciados por hora del día
            </CardDescription>
          </div>
          <span className="rounded-md bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
            {total} inicio{total === 1 ? "" : "s"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyChart message="Sin trabajos iniciados en el rango" />
        ) : (
          <BarChart
            data={data}
            config={HOUR_CONFIG}
            xKey="hour"
            series={HOUR_SERIES}
            xTickFormatter={(value) => `${String(value).padStart(2, "0")}:00`}
            tooltipLabelFormatter={(label) =>
              `${String(label).padStart(2, "0")}:00 h`
            }
            className="h-[280px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function SizeAccuracyCard({ data }: { data: PrintingAnalyticsSizeRow[] }) {
  const rows = useMemo(() => data.slice(0, 8), [data]);

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">Tiempo por medida</CardTitle>
          <CardDescription className="text-xs">
            Minutos de impresión planificados contra reales
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyChart message="Sin medidas registradas" />
        ) : (
          <BarChart
            data={rows}
            config={SIZE_CONFIG}
            xKey="sizeKey"
            series={SIZE_SERIES}
            yTickFormatter={(value) => `${value}m`}
            tooltipValueFormatter={(value) => `${Number(value)} min`}
            showLegend
            className="h-[260px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function formatHours(value: number): string {
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 1 })} h`;
}

function formatDayTick(dateKey: string): string {
  return format(parseISO(dateKey), "d MMM", { locale: es });
}

function formatDayFull(dateKey: string): string {
  return format(parseISO(dateKey), "EEEE d 'de' MMMM", { locale: es });
}
