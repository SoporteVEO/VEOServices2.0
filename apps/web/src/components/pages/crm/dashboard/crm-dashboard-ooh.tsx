"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, Lock, RefreshCw } from "lucide-react";
import type { CrmDashboard, CrmOohDashboard } from "@/api/crm/crm.types";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { BarChart, type BarChartSeries } from "@/components/ui/bar-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DonutChart } from "@/components/ui/donut-chart";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatCompactMoney, timeAgo } from "../crm-format";
import { MEDIA_TYPE_LABELS, SITE_KIND_ICONS } from "../crm-ooh-const";

interface Props {
  dashboard: CrmDashboard | undefined;
  isLoading: boolean;
  onOpenDeal: (dealId: string) => void;
}

type ForecastDatum = CrmOohDashboard["flightForecast"][number];

const FORECAST_CONFIG = {
  booked: { label: "Vendido", color: "var(--chart-2)" },
  held: { label: "Reservado", color: "var(--chart-4)" },
} satisfies ChartConfig;

const FORECAST_SERIES: BarChartSeries<ForecastDatum>[] = [
  { dataKey: "booked", stackId: "flight", radius: [0, 0, 0, 0] },
  { dataKey: "held", stackId: "flight" },
];

const MEDIA_COLORS: Record<string, string> = {
  static: "var(--chart-1)",
  digital: "var(--chart-3)",
  mixed: "var(--chart-4)",
  none: "var(--chart-5)",
};

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  const raw = format(new Date(year, month - 1, 1), "MMM yy", { locale: es });
  return raw[0] ? raw[0].toUpperCase() + raw.slice(1) : raw;
}

export function CrmDashboardOoh({ dashboard, isLoading, onOpenDeal }: Props) {
  const media = useMemo(() => {
    const rows = dashboard?.ooh.byMediaType ?? [];
    const config: ChartConfig = {};
    const slices = rows
      .filter((row) => row.openValue > 0)
      .map((row) => {
        const key = (row.mediaType ?? "NONE").toLowerCase();
        config[key] = {
          label: row.mediaType ? MEDIA_TYPE_LABELS[row.mediaType] : "Sin definir",
          color: MEDIA_COLORS[key],
        };
        return { key, value: row.openValue };
      });
    return { config, slices, total: slices.reduce((sum, slice) => sum + slice.value, 0) };
  }, [dashboard]);

  if (isLoading || !dashboard) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className={i === 0 ? "xl:col-span-2" : undefined}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { ooh } = dashboard;
  const hasForecast = ooh.flightForecast.some((row) => row.booked > 0 || row.held > 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Ocupación por mes de exhibición</CardTitle>
          <CardDescription>
            Valor de sitios vendidos y reservados según su periodo, próximos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasForecast ? (
            <BarChart
              config={FORECAST_CONFIG}
              data={ooh.flightForecast}
              xKey="month"
              series={FORECAST_SERIES}
              xTickFormatter={(value) => monthLabel(String(value))}
              yTickFormatter={formatCompactMoney}
              tooltipLabelFormatter={(label) => monthLabel(String(label))}
              tooltipValueFormatter={(value) => formatMoney(value)}
            />
          ) : (
            <EmptyState message="Aún no hay sitios reservados ni vendidos en los próximos meses." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservas por vencer</CardTitle>
          <CardDescription>
            {ooh.holds.active} activas · {ooh.holds.expiringSoon} vencen pronto
            {ooh.holds.expired > 0 ? ` · ${ooh.holds.expired} vencidas` : ""}
          </CardDescription>
          <CardAction>
            <Button asChild variant="ghost" sizeVariant="sm">
              <Link href="/dashboard/crm/disponibilidad">
                Disponibilidad <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {ooh.holds.items.length === 0 ? (
            <EmptyState message="No tienes reservas por vencer." />
          ) : (
            <ul className="flex flex-col divide-y">
              {ooh.holds.items.map((hold) => {
                const Icon = SITE_KIND_ICONS[hold.kind];
                return (
                  <li key={hold.siteId}>
                    <button
                      type="button"
                      onClick={() => onOpenDeal(hold.dealId)}
                      className="flex w-full items-start gap-3 py-2.5 text-left hover:bg-muted/40"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {hold.code} <span className="font-normal text-muted-foreground">· {hold.label}</span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{hold.dealTitle}</p>
                      </div>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 text-xs tabular-nums",
                          hold.isExpired
                            ? "text-red-600 dark:text-red-400"
                            : "text-violet-700 dark:text-violet-300",
                        )}
                      >
                        <Lock className="size-3" />
                        {hold.isExpired ? "Vencida" : timeAgo(hold.holdUntil)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mezcla de medios</CardTitle>
          <CardDescription>Valor abierto por tipo de medio</CardDescription>
        </CardHeader>
        <CardContent>
          {media.total === 0 ? (
            <EmptyState message="Sin negocios abiertos." />
          ) : (
            <DonutChart
              config={media.config}
              slices={media.slices}
              centerValue={formatCompactMoney(media.total)}
              centerLabel="Abierto"
            />
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Renovaciones</CardTitle>
          <CardDescription>
            Contratos de vallas y campañas digitales que terminan en los próximos 60 días
          </CardDescription>
          <CardAction>
            <Button asChild variant="ghost" sizeVariant="sm">
              <Link href="/dashboard/crm/renovaciones">
                Ver renovaciones <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {ooh.renewals.available ? (
            <div className="grid grid-cols-3 gap-3">
              <RenewalStat label="Por vencer" value={ooh.renewals.due} />
              <RenewalStat
                label="Sin gestionar"
                value={ooh.renewals.unmanaged}
                tone={ooh.renewals.unmanaged > 0 ? "danger" : undefined}
              />
              <RenewalStat
                label="En 30 días"
                value={ooh.renewals.endingIn30}
                tone={ooh.renewals.endingIn30 > 0 ? "warning" : undefined}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="size-4" />
              No se pudo consultar los contratos en este momento.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RenewalStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger" | "warning";
}) {
  return (
    <div className="flex flex-col gap-1 border border-border p-3">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "danger" && "text-red-600 dark:text-red-400",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
