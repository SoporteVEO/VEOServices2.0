"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CrmDashboard } from "@/api/crm/crm.types";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { BarChart, type BarChartSeries } from "@/components/ui/bar-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DonutChart } from "@/components/ui/donut-chart";
import { formatMoney } from "@/lib/format";
import { ACTIVITY_LABELS, SOURCE_LABELS } from "../crm-const";
import { formatCompactMoney } from "../crm-format";

interface Props {
  dashboard: CrmDashboard | undefined;
  isLoading: boolean;
}

const STAGE_CONFIG = {
  value: { label: "Valor abierto", color: "var(--chart-1)" },
} satisfies ChartConfig;

const TREND_CONFIG = {
  wonValue: { label: "Ganado", color: "var(--chart-2)" },
} satisfies ChartConfig;

const COUNT_TREND_CONFIG = {
  newDeals: { label: "Nuevos", color: "var(--chart-1)" },
  wonCount: { label: "Ganados", color: "var(--chart-2)" },
  lostCount: { label: "Perdidos", color: "var(--chart-5)" },
} satisfies ChartConfig;

const ACTIVITY_CONFIG = {
  count: { label: "Actividades", color: "var(--chart-3)" },
} satisfies ChartConfig;

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type StageDatum = { name: string; value: number; count: number };
type TrendDatum = CrmDashboard["trend"][number];
type ActivityDatum = { label: string; count: number };

const STAGE_SERIES: BarChartSeries<StageDatum>[] = [{ dataKey: "value" }];
const TREND_SERIES: BarChartSeries<TrendDatum>[] = [{ dataKey: "wonValue" }];
const COUNT_TREND_SERIES: BarChartSeries<TrendDatum>[] = [
  { dataKey: "newDeals" },
  { dataKey: "wonCount" },
  { dataKey: "lostCount" },
];
const ACTIVITY_SERIES: BarChartSeries<ActivityDatum>[] = [{ dataKey: "count" }];

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  const raw = format(new Date(year, month - 1, 1), "MMM yy", { locale: es });
  return raw[0] ? raw[0].toUpperCase() + raw.slice(1) : raw;
}

export function CrmDashboardCharts({ dashboard, isLoading }: Props) {
  const stageData = useMemo<StageDatum[]>(
    () =>
      (dashboard?.pipeline.stages ?? [])
        .filter((stage) => stage.kind === "OPEN")
        .map((stage) => ({ name: stage.name, value: stage.value, count: stage.count })),
    [dashboard],
  );

  const sources = useMemo(() => {
    const rows = dashboard?.bySource ?? [];
    const config: ChartConfig = {};
    const slices = rows.map((row, index) => {
      const key = (row.source ?? "NONE").toLowerCase();
      config[key] = {
        label: row.source ? SOURCE_LABELS[row.source] : "Sin origen",
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
      return { key, value: row.count };
    });
    return { config, slices, total: rows.reduce((sum, row) => sum + row.count, 0) };
  }, [dashboard]);

  const activityData = useMemo<ActivityDatum[]>(
    () =>
      (dashboard?.activityByType ?? []).map((row) => ({
        label: ACTIVITY_LABELS[row.type],
        count: row.count,
      })),
    [dashboard],
  );

  if (isLoading || !dashboard) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[240px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline por etapa</CardTitle>
          <CardDescription>
            Valor abierto en {dashboard.pipeline.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stageData.every((s) => s.count === 0) ? (
            <EmptyChart message="No hay negocios abiertos." />
          ) : (
            <BarChart
              config={STAGE_CONFIG}
              data={stageData}
              xKey="name"
              series={STAGE_SERIES}
              yTickFormatter={formatCompactMoney}
              tooltipValueFormatter={(value) => formatMoney(value)}
              tooltipLabelFormatter={(label, payload) =>
                `${label} · ${payload[0]?.payload.count ?? 0} negocios`
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ventas ganadas</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            config={TREND_CONFIG}
            data={dashboard.trend}
            xKey="month"
            series={TREND_SERIES}
            xTickFormatter={(value) => monthLabel(String(value))}
            yTickFormatter={formatCompactMoney}
            tooltipLabelFormatter={(label) => monthLabel(String(label))}
            tooltipValueFormatter={(value) => formatMoney(value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flujo de negocios</CardTitle>
          <CardDescription>Nuevos, ganados y perdidos por mes</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            config={COUNT_TREND_CONFIG}
            data={dashboard.trend}
            xKey="month"
            series={COUNT_TREND_SERIES}
            xTickFormatter={(value) => monthLabel(String(value))}
            tooltipLabelFormatter={(label) => monthLabel(String(label))}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Origen de negocios</CardTitle>
            <CardDescription>Negocios creados en el período</CardDescription>
          </CardHeader>
          <CardContent>
            {sources.total === 0 ? (
              <EmptyChart message="Sin negocios en el período." />
            ) : (
              <DonutChart
                config={sources.config}
                slices={sources.slices}
                centerValue={sources.total}
                centerLabel="Negocios"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actividad</CardTitle>
            <CardDescription>Interacciones en el período</CardDescription>
          </CardHeader>
          <CardContent>
            {activityData.length === 0 ? (
              <EmptyChart message="Sin actividad registrada." />
            ) : (
              <BarChart
                config={ACTIVITY_CONFIG}
                data={activityData}
                xKey="label"
                series={ACTIVITY_SERIES}
                yTickFormatter={null}
                className="h-[220px]"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
