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
} from "lucide-react";

import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";

import type { PrintingAnalyticsOverview } from "@/api/analytics/analytics.types";

const KPI_SKELETON_COUNT = 12;

interface Props {
  overview?: PrintingAnalyticsOverview;
  isLoading: boolean;
}

export function PrintingAnalyticsKpis({ overview, isLoading }: Props) {
  if (isLoading || !overview) {
    return <KpiGridSkeleton count={KPI_SKELETON_COUNT} />;
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
    <KpiGrid>
      {items.map((item) => (
        <KpiTile key={item.label} item={item} />
      ))}
    </KpiGrid>
  );
}
