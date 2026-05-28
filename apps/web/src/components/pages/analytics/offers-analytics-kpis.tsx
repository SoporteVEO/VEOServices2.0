"use client";

import {
  CheckCircle2,
  Clock,
  FileText,
  Percent,
  Receipt,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { NativeCounterUp } from "@/components/ui/counter-up";
import { cn } from "@/lib/utils";

import type { OffersAnalyticsOverview } from "@/api/analytics/analytics.types";

type Tone = "primary" | "emerald" | "amber" | "rose" | "sky" | "violet";

const TONE_STYLES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

interface KpiItem {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  detail?: string;
  tone?: Tone;
}

const KPI_SKELETON_COUNT = 8;

interface OffersAnalyticsKpisProps {
  overview?: OffersAnalyticsOverview;
  isLoading: boolean;
}

export function OffersAnalyticsKpis({
  overview,
  isLoading,
}: OffersAnalyticsKpisProps) {
  if (isLoading || !overview) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {Array.from({ length: KPI_SKELETON_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
    );
  }

  const { totals, byStatus } = overview;

  const items: KpiItem[] = [
    {
      icon: FileText,
      label: "Cotizaciones creadas",
      value: totals.count,
      detail:
        totals.count === 0
          ? "Sin cotizaciones en el rango"
          : `Por ${totals.uniqueCreators} usuario${
              totals.uniqueCreators === 1 ? "" : "s"
            }`,
      tone: "violet",
    },
    {
      icon: Wallet,
      label: "Monto total cotizado",
      value: totals.totalAmount,
      prefix: "USD ",
      detail: `Renta + impresión`,
      tone: "primary",
    },
    {
      icon: Percent,
      label: "Tasa de aceptación",
      value: totals.conversionRate,
      suffix: "%",
      decimals: 1,
      detail: `${byStatus.accepted.count} de ${totals.count} aceptadas`,
      tone: totals.conversionRate >= 50 ? "emerald" : "amber",
    },
    {
      icon: Receipt,
      label: "Ticket promedio",
      value: totals.averageTicket,
      prefix: "USD ",
      detail:
        totals.count === 0
          ? "Sin cotizaciones"
          : `Promedio entre ${totals.count} cotización${
              totals.count === 1 ? "" : "es"
            }`,
      tone: "sky",
    },
    {
      icon: CheckCircle2,
      label: "Aceptadas",
      value: byStatus.accepted.totalAmount,
      prefix: "USD ",
      detail:
        byStatus.accepted.count === 0
          ? "Sin cotizaciones aceptadas"
          : `${byStatus.accepted.count} cotización${
              byStatus.accepted.count === 1 ? "" : "es"
            } aceptada${byStatus.accepted.count === 1 ? "" : "s"}`,
      tone: "emerald",
    },
    {
      icon: Clock,
      label: "Pendientes",
      value: byStatus.pending.totalAmount,
      prefix: "USD ",
      detail:
        byStatus.pending.count === 0
          ? "Sin cotizaciones pendientes"
          : `${byStatus.pending.count} esperando respuesta`,
      tone: byStatus.pending.totalAmount > 0 ? "amber" : "primary",
    },
    {
      icon: XCircle,
      label: "Rechazadas",
      value: byStatus.declined.totalAmount,
      prefix: "USD ",
      detail:
        byStatus.declined.count === 0
          ? "Sin cotizaciones rechazadas"
          : `${byStatus.declined.count} cotización${
              byStatus.declined.count === 1 ? "" : "es"
            } rechazada${byStatus.declined.count === 1 ? "" : "s"}`,
      tone: byStatus.declined.count > 0 ? "rose" : "primary",
    },
    {
      icon: Users,
      label: "Clientes únicos",
      value: totals.uniqueCustomers,
      detail: `${totals.averageItemsPerOffer.toFixed(1)} ítems / cotización en promedio`,
      tone: "sky",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          size="sm"
          className="border-border/80 shadow-none"
        >
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </CardTitle>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md",
                  TONE_STYLES[item.tone ?? "primary"],
                )}
              >
                <item.icon className="size-3.5" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5">
            <NativeCounterUp
              value={item.value}
              prefix={item.prefix}
              suffix={item.suffix}
              decimals={item.decimals ?? 0}
              label={item.label}
              duration={1.4}
              className="text-xl font-semibold tracking-tight"
            />
            {item.detail ? (
              <span className="truncate text-[11px] text-muted-foreground">
                {item.detail}
              </span>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
