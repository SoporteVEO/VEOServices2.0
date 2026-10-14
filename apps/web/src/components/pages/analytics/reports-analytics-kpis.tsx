"use client";

import {
  ClipboardCheck,
  ClipboardList,
  Hammer,
  Percent,
  Send,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";

import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";

import type { ReportsAnalyticsOverview } from "@/api/analytics/analytics.types";

const KPI_SKELETON_COUNT = 8;

interface ReportsAnalyticsKpisProps {
  overview?: ReportsAnalyticsOverview;
  isLoading: boolean;
}

export function ReportsAnalyticsKpis({
  overview,
  isLoading,
}: ReportsAnalyticsKpisProps) {
  if (isLoading || !overview) {
    return <KpiGridSkeleton count={KPI_SKELETON_COUNT} />;
  }

  const { totals, byType, currentMonthCompliance } = overview;
  const { activeContractsTotal, monthlyReportsSent, pending, coverage } =
    currentMonthCompliance;

  const items: KpiItem[] = [
    {
      icon: Send,
      label: "Reportes enviados",
      value: totals.total,
      detail: `Por ${totals.distinctUsers} usuario${
        totals.distinctUsers === 1 ? "" : "s"
      } en ${totals.distinctContracts} contrato${
        totals.distinctContracts === 1 ? "" : "s"
      }`,
      tone: "primary",
    },
    {
      icon: TrendingUp,
      label: "Promedio diario",
      value: totals.averagePerDay,
      decimals: 2,
      detail: "Reportes por día en el rango",
      tone: "violet",
    },
    {
      icon: ClipboardCheck,
      label: "Mensuales",
      value: byType.monthly.count,
      detail: `${byType.monthly.distinctContracts} contrato${
        byType.monthly.distinctContracts === 1 ? "" : "s"
      } cubierto${byType.monthly.distinctContracts === 1 ? "" : "s"}`,
      tone: "sky",
    },
    {
      icon: Hammer,
      label: "Instalación",
      value: byType.installation.count,
      detail: `${byType.installation.distinctContracts} contrato${
        byType.installation.distinctContracts === 1 ? "" : "s"
      } cubierto${byType.installation.distinctContracts === 1 ? "" : "s"}`,
      tone: "violet",
    },
    {
      icon: Wrench,
      label: "Mantenimiento",
      value: byType.maintenance.count,
      detail: `${byType.maintenance.distinctContracts} contrato${
        byType.maintenance.distinctContracts === 1 ? "" : "s"
      } cubierto${byType.maintenance.distinctContracts === 1 ? "" : "s"}`,
      tone: "amber",
    },
    {
      icon: Percent,
      label: "Cobertura mensual",
      value: coverage,
      suffix: "%",
      decimals: 1,
      detail: `${monthlyReportsSent} de ${activeContractsTotal} contratos activos`,
      tone: coverage >= 80 ? "emerald" : coverage >= 50 ? "amber" : "rose",
    },
    {
      icon: ClipboardList,
      label: "Pendientes mensuales",
      value: pending,
      detail:
        pending === 0
          ? "Todos los contratos al día"
          : `Sumatoria por usuario · en el rango`,
      tone: pending === 0 ? "emerald" : "amber",
    },
    {
      icon: Users,
      label: "Usuarios activos",
      value: totals.distinctUsers,
      detail: `${activeContractsTotal} contratos activos asignados`,
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
