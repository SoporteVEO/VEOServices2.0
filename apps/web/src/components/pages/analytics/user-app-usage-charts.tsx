"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { UserAppUsageReport } from "@/api/analytics/analytics.types";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { AreaChart, type AreaChartSeries } from "@/components/ui/area-chart";
import { BarChart, type BarChartSeries } from "@/components/ui/bar-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { formatDuration } from "@/lib/format";

const DAILY_CONFIG = {
  totalMs: {
    label: "Tiempo activo",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const TOP_CONFIG = {
  totalMs: {
    label: "Tiempo activo",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type DailyDatum = { dateKey: string; totalMs: number };
type TopDatum = { shortLabel: string; totalMs: number };

const DAILY_SERIES: AreaChartSeries<DailyDatum>[] = [{ dataKey: "totalMs" }];
const TOP_SERIES: BarChartSeries<TopDatum>[] = [{ dataKey: "totalMs" }];

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function formatDayLabel(dateKey: string): string {
  return format(parseDateKey(dateKey), "d MMM", { locale: es });
}

function formatTooltipDate(dateKey: string): string {
  const raw = format(parseDateKey(dateKey), "EEEE d 'de' MMMM", {
    locale: es,
  });
  return raw[0] ? raw[0].toUpperCase() + raw.slice(1) : raw;
}

function shortUserLabel(
  u: UserAppUsageReport["users"][number],
  maxLen: number,
): string {
  const name = [u.firstName].filter(Boolean).join(" ");
  const base = name || u.email;
  if (base.length <= maxLen) return base;
  return `${base.slice(0, maxLen - 1)}…`;
}

export function UserAppUsageCharts({
  report,
  isLoading,
}: {
  report: UserAppUsageReport | undefined;
  isLoading: boolean;
}) {
  const dailyData = useMemo<DailyDatum[]>(() => {
    if (!report?.daily.length) return [];
    return report.daily.map((d) => ({
      dateKey: d.date,
      totalMs: d.totalMs,
    }));
  }, [report]);

  const topData = useMemo<TopDatum[]>(() => {
    if (!report?.users.length) return [];
    return report.users.slice(0, 12).map((u) => ({
      shortLabel: shortUserLabel(u, 22),
      totalMs: u.totalMs,
    }));
  }, [report]);

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad por día</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Sin datos en el rango seleccionado.
            </p>
          ) : (
            <AreaChart
              config={DAILY_CONFIG}
              data={dailyData}
              xKey="dateKey"
              series={DAILY_SERIES}
              xTickFormatter={(v) => formatDayLabel(String(v))}
              yTickFormatter={(v) => formatDuration(v)}
              tooltipLabelFormatter={(label) =>
                formatTooltipDate(String(label))
              }
              tooltipValueFormatter={(v) => formatDuration(v)}
              showLegend={false}
              className="h-[260px]"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuarios con más tiempo</CardTitle>
        </CardHeader>
        <CardContent>
          {topData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Sin datos en el rango seleccionado.
            </p>
          ) : (
            <BarChart
              config={TOP_CONFIG}
              data={topData}
              xKey="shortLabel"
              series={TOP_SERIES}
              yTickFormatter={(v) => formatDuration(v)}
              tooltipValueFormatter={(v) => formatDuration(v)}
              showLegend={false}
              className="h-[260px]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
