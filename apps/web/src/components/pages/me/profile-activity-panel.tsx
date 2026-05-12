"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarClock,
  CalendarDays,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useMyMetricsSummary } from "@/api/user-metrics/user-metrics.get";
import type { UserMetricsSummary } from "@/api/user-metrics/user-metrics.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { BarChart, type BarChartSeries } from "@/components/ui/bar-chart";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const CHART_DAYS = 14;

const CHART_CONFIG = {
  activeMs: {
    label: "Tiempo activo ",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type ChartDatum = {
  dateKey: string;
  activeMs: number;
};

const CHART_SERIES: BarChartSeries<ChartDatum>[] = [{ dataKey: "activeMs" }];

type StatTone = "primary" | "emerald" | "violet";

const TONE_STYLES: Record<StatTone, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

type StatItem = {
  icon: LucideIcon;
  label: string;
  ms: number;
  tone: StatTone;
};

function getMonterreyTodayKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

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

function buildChartData(
  summary: UserMetricsSummary | undefined,
  n: number,
): ChartDatum[] {
  const byKey = new Map(
    (summary?.days ?? []).map((d) => [d.date, d.activeMs] as const),
  );
  const todayKey = getMonterreyTodayKey();
  const result: ChartDatum[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dateKey = shiftDateKey(todayKey, -i);
    result.push({
      dateKey,
      activeMs: byKey.get(dateKey) ?? 0,
    });
  }
  return result;
}

export function ProfileActivityPanel() {
  const { data: metrics, isLoading } = useMyMetricsSummary();

  const chartData = useMemo(
    () => buildChartData(metrics, CHART_DAYS),
    [metrics],
  );

  const hasAnyActivity = useMemo(
    () => chartData.some((d) => d.activeMs > 0),
    [chartData],
  );

  const stats: StatItem[] = [
    {
      icon: Clock,
      label: "Tiempo hoy",
      ms: metrics?.todayMs ?? 0,
      tone: "primary",
    },
    {
      icon: CalendarDays,
      label: "Esta semana",
      ms: metrics?.weekMs ?? 0,
      tone: "emerald",
    },
    {
      icon: CalendarClock,
      label: "Este mes",
      ms: metrics?.monthMs ?? 0,
      tone: "violet",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Seguimiento de tu actividad durante el horario laboral.">
          Tiempo en la app
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-lg border border-border/80 bg-card/40 p-3"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md",
                  TONE_STYLES[stat.tone],
                )}
              >
                <stat.icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <div className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    formatDuration(stat.ms)
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Últimos {CHART_DAYS} días
            </p>
            {hasAnyActivity ? null : (
              <p className="text-xs text-muted-foreground">Sin actividad aún</p>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <BarChart
              config={CHART_CONFIG}
              data={chartData}
              xKey="dateKey"
              series={CHART_SERIES}
              xTickFormatter={(value) => formatDayLabel(String(value))}
              yTickFormatter={(value) => formatDuration(value)}
              tooltipValueFormatter={(value) => formatDuration(value)}
              tooltipLabelFormatter={(label) =>
                formatTooltipDate(String(label))
              }
              showLegend={false}
              className="h-[260px]"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
