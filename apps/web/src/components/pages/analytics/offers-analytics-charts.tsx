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
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import type {
  OffersAnalyticsByUserRow,
  OffersAnalyticsDailyPoint,
  OffersAnalyticsMonthlyPoint,
  OffersAnalyticsOverview,
} from "@/api/analytics/analytics.types";

const TREND_CONFIG = {
  pending: { label: "Pendientes", color: "var(--chart-4)" },
  accepted: { label: "Aceptadas", color: "var(--chart-2)" },
  declined: { label: "Rechazadas", color: "var(--chart-5)" },
} satisfies ChartConfig;

const AMOUNT_CONFIG = {
  acceptedAmount: { label: "Aceptadas", color: "var(--chart-2)" },
  pendingAmount: { label: "Pendientes", color: "var(--chart-4)" },
  declinedAmount: { label: "Rechazadas", color: "var(--chart-5)" },
} satisfies ChartConfig;

const STATUS_DONUT_CONFIG = {
  accepted: { label: "Aceptadas", color: "var(--chart-2)" },
  pending: { label: "Pendientes", color: "var(--chart-4)" },
  declined: { label: "Rechazadas", color: "var(--chart-5)" },
} satisfies ChartConfig;

const USERS_CONFIG = {
  acceptedAmount: { label: "Aceptadas", color: "var(--chart-2)" },
  pendingAmount: { label: "Pendientes", color: "var(--chart-4)" },
} satisfies ChartConfig;

const DAILY_COUNT_SERIES: BarChartSeries<OffersAnalyticsDailyPoint>[] = [
  { dataKey: "accepted", stackId: "status" },
  { dataKey: "pending", stackId: "status" },
  { dataKey: "declined", stackId: "status" },
];

const MONTHLY_AMOUNT_SERIES: AreaChartSeries<OffersAnalyticsMonthlyPoint>[] = [
  { dataKey: "acceptedAmount", type: "monotone", stackId: "amount" },
  { dataKey: "pendingAmount", type: "monotone", stackId: "amount" },
  { dataKey: "declinedAmount", type: "monotone", stackId: "amount" },
];

type UserChartDatum = {
  shortLabel: string;
  acceptedAmount: number;
  pendingAmount: number;
};

const USER_CHART_SERIES: BarChartSeries<UserChartDatum>[] = [
  { dataKey: "acceptedAmount", stackId: "amount" },
  { dataKey: "pendingAmount", stackId: "amount" },
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

function formatCompactMoney(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function shortUserLabel(user: OffersAnalyticsByUserRow, maxLen = 22): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const base = name.trim() || user.email;
  if (base.length <= maxLen) return base;
  return `${base.slice(0, maxLen - 1)}…`;
}

interface OffersAnalyticsChartsProps {
  overview?: OffersAnalyticsOverview;
  isLoading: boolean;
}

export function OffersAnalyticsCharts({
  overview,
  isLoading,
}: OffersAnalyticsChartsProps) {
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

  const { daily, monthly, byStatus, byUser } = overview;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <DailyOffersCard data={daily} />
      <StatusDonutCard overview={overview} />

      <MonthlyAmountCard data={monthly} />
      <TopUsersCard data={byUser} byStatus={byStatus} />
    </div>
  );
}

function DailyOffersCard({ data }: { data: OffersAnalyticsDailyPoint[] }) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.total, 0),
    [data],
  );

  return (
    <Card size="sm" className="border-border/80 shadow-none lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Cotizaciones por día</CardTitle>
            <CardDescription className="text-xs">
              Cantidad creada por día, distribuida por estado
            </CardDescription>
          </div>
          <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            {total.toLocaleString("en-US")} cotización
            {total === 1 ? "" : "es"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyChart message="Sin cotizaciones en el rango seleccionado" />
        ) : (
          <BarChart
            data={data}
            config={TREND_CONFIG}
            xKey="dateKey"
            series={DAILY_COUNT_SERIES}
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

function MonthlyAmountCard({
  data,
}: {
  data: OffersAnalyticsMonthlyPoint[];
}) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.totalAmount, 0),
    [data],
  );

  return (
    <Card size="sm" className="border-border/80 shadow-none lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Monto cotizado por mes</CardTitle>
            <CardDescription className="text-xs">
              Renta + impresión por mes, separado por estado
            </CardDescription>
          </div>
          <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {formatMoney(total)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyChart message="Sin cotizaciones en el rango seleccionado" />
        ) : (
          <AreaChart
            data={data}
            config={AMOUNT_CONFIG}
            xKey="monthKey"
            series={MONTHLY_AMOUNT_SERIES}
            xTickFormatter={(value) => formatMonthLabel(String(value))}
            yTickFormatter={(value) => formatCompactMoney(Number(value))}
            tooltipLabelFormatter={(label) => formatMonthLabel(String(label))}
            tooltipValueFormatter={(value) => formatMoney(Number(value))}
            showLegend
            className="h-[280px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

function StatusDonutCard({
  overview,
}: {
  overview: OffersAnalyticsOverview;
}) {
  const slices = [
    { key: "accepted", value: overview.byStatus.accepted.count },
    { key: "pending", value: overview.byStatus.pending.count },
    { key: "declined", value: overview.byStatus.declined.count },
  ];
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const acceptedRate =
    total > 0 ? overview.byStatus.accepted.count / total : 0;

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
            config={STATUS_DONUT_CONFIG}
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
          <DonutLegend
            colorClassName="bg-[var(--chart-2)]"
            label="Aceptadas"
            value={overview.byStatus.accepted.count}
          />
          <DonutLegend
            colorClassName="bg-[var(--chart-4)]"
            label="Pendientes"
            value={overview.byStatus.pending.count}
          />
          <DonutLegend
            colorClassName="bg-[var(--chart-5)]"
            label="Rechazadas"
            value={overview.byStatus.declined.count}
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

function TopUsersCard({
  data,
  byStatus,
}: {
  data: OffersAnalyticsByUserRow[];
  byStatus: OffersAnalyticsOverview["byStatus"];
}) {
  const chartData = useMemo<UserChartDatum[]>(() => {
    return data
      .slice(0, 8)
      .map((user) => ({
        shortLabel: shortUserLabel(user, 18),
        acceptedAmount: user.acceptedAmount,
        pendingAmount: user.pendingAmount,
      }))
      .filter((d) => d.acceptedAmount > 0 || d.pendingAmount > 0);
  }, [data]);

  const totalAccepted = byStatus.accepted.totalAmount;
  const hasData = chartData.length > 0;

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">Top usuarios</CardTitle>
          <CardDescription className="text-xs">
            Monto aceptado + pendiente por usuario (top 8)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyChart message="Sin cotizaciones por usuario" />
        ) : (
          <>
            <BarChart
              data={chartData}
              config={USERS_CONFIG}
              xKey="shortLabel"
              series={USER_CHART_SERIES}
              yTickFormatter={(value) => formatCompactMoney(Number(value))}
              tooltipValueFormatter={(value) => formatMoney(Number(value))}
              showLegend
              className="h-[260px]"
            />
            <p className="pt-2 text-[11px] text-muted-foreground">
              Aceptado total: {formatMoney(totalAccepted)}
            </p>
          </>
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
