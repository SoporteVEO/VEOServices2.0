"use client";

import {
  Activity,
  AlarmClock,
  Ban,
  CheckCircle2,
  Flame,
  Gauge,
  Printer,
  Ruler,
  Snowflake,
  Target,
  Timer,
  TrendingUp,
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

import type { PrintingAnalyticsOverview } from "@/api/analytics/analytics.types";

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
  suffix?: string;
  decimals?: number;
  detail?: string;
  tone?: Tone;
}

const KPI_SKELETON_COUNT = 12;

interface Props {
  overview?: PrintingAnalyticsOverview;
  isLoading: boolean;
}

export function PrintingAnalyticsKpis({ overview, isLoading }: Props) {
  if (isLoading || !overview) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: KPI_SKELETON_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
    );
  }

  const { totals } = overview;

  const items: KpiItem[] = [
    {
      icon: Printer,
      label: "Trabajos agendados",
      value: totals.jobs,
      detail: `${totals.scheduled} pendientes · ${totals.running} en curso`,
      tone: "primary",
    },
    {
      icon: CheckCircle2,
      label: "Trabajos finalizados",
      value: totals.completed,
      detail:
        totals.jobs > 0
          ? `${Math.round((totals.completed / totals.jobs) * 100)}% del total`
          : "Sin trabajos",
      tone: "emerald",
    },
    {
      icon: Ban,
      label: "Trabajos cancelados",
      value: totals.cancelled,
      detail: "Cancelados antes de finalizar",
      tone: "rose",
    },
    {
      icon: Gauge,
      label: "Uso de máquinas",
      value: totals.utilization,
      suffix: "%",
      decimals: 1,
      detail: `${totals.actualHours} h de ${totals.availableHours} h disponibles`,
      tone: "violet",
    },
    {
      icon: Activity,
      label: "Horas de impresión",
      value: totals.actualPrintHours,
      suffix: " h",
      decimals: 1,
      detail: `${totals.plannedPrintHours} h planificadas`,
      tone: "sky",
    },
    {
      icon: Flame,
      label: "Horas de set up",
      value: totals.actualSetupHours,
      suffix: " h",
      decimals: 1,
      detail: `Promedio ${totals.avgSetupMinutes} min por trabajo`,
      tone: "amber",
    },
    {
      icon: Snowflake,
      label: "Horas de cooldown",
      value: totals.actualCooldownHours,
      suffix: " h",
      decimals: 1,
      detail: `Promedio ${totals.avgCooldownMinutes} min por trabajo`,
      tone: "sky",
    },
    {
      icon: Timer,
      label: "Duración media",
      value: totals.avgJobMinutes,
      suffix: " min",
      decimals: 0,
      detail: `Impresión ${totals.avgPrintMinutes} min`,
      tone: "primary",
    },
    {
      icon: Target,
      label: "Precisión del plan",
      value: totals.planAccuracy,
      suffix: "%",
      decimals: 1,
      detail: "Minutos planificados sobre reales",
      tone: totals.planAccuracy >= 90 ? "emerald" : "amber",
    },
    {
      icon: AlarmClock,
      label: "Inicios puntuales",
      value: totals.onTimeStartRate,
      suffix: "%",
      decimals: 1,
      detail: `Desviación media ${totals.avgStartDelayMinutes} min`,
      tone: totals.onTimeStartRate >= 80 ? "emerald" : "rose",
    },
    {
      icon: Ruler,
      label: "Metros cuadrados",
      value: totals.squareMeters,
      suffix: " m²",
      decimals: 1,
      detail: "Impresos en trabajos finalizados",
      tone: "violet",
    },
    {
      icon: TrendingUp,
      label: "Minutos por m²",
      value: totals.minutesPerSquareMeter,
      suffix: " min",
      decimals: 2,
      detail: `${totals.activeMachines} máquina${totals.activeMachines === 1 ? "" : "s"} activa${totals.activeMachines === 1 ? "" : "s"}`,
      tone: "primary",
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
