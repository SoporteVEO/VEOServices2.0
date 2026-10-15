"use client";

import {
  AlarmClock,
  Briefcase,
  CircleDollarSign,
  Gauge,
  Mail,
  MessageCircle,
  Percent,
  Scale,
  Timer,
  Trophy,
} from "lucide-react";
import type { CrmDashboard } from "@/api/crm/crm.types";
import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";
import { formatMoney } from "@/lib/format";

interface Props {
  dashboard: CrmDashboard | undefined;
  isLoading: boolean;
}

export function CrmDashboardKpis({ dashboard, isLoading }: Props) {
  if (isLoading || !dashboard) return <KpiGridSkeleton count={10} />;

  const { totals } = dashboard;
  const items: KpiItem[] = [
    {
      icon: Briefcase,
      label: "Negocios abiertos",
      value: totals.openDeals,
      detail: `${formatMoney(totals.openValue)} en pipeline`,
    },
    {
      icon: Scale,
      label: "Pipeline ponderado",
      value: totals.weightedValue,
      prefix: "$",
      detail: "Valor × probabilidad de la etapa",
      tone: "violet",
    },
    {
      icon: Trophy,
      label: "Ganado en el período",
      value: totals.wonValue,
      prefix: "$",
      detail: `${totals.wonCount} negocio${totals.wonCount === 1 ? "" : "s"}`,
      tone: "emerald",
    },
    {
      icon: Percent,
      label: "Tasa de cierre",
      value: totals.winRate,
      suffix: "%",
      detail: `${totals.wonCount} ganados · ${totals.lostCount} perdidos`,
      tone: totals.winRate >= 50 ? "emerald" : "amber",
    },
    {
      icon: CircleDollarSign,
      label: "Ticket promedio",
      value: totals.avgDealSize,
      prefix: "$",
      detail: "Negocios ganados en el período",
      tone: "sky",
    },
    {
      icon: Timer,
      label: "Ciclo de venta",
      value: totals.avgCycleDays,
      suffix: " días",
      detail: "Desde creación hasta cierre",
      tone: "neutral",
    },
    {
      icon: Gauge,
      label: "Negocios nuevos",
      value: totals.newDeals,
      detail: `${totals.activities} actividades registradas`,
      tone: "primary",
    },
    {
      icon: Mail,
      label: "Correos enviados",
      value: totals.emailsSent,
      tone: "sky",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp enviados",
      value: totals.whatsappSent,
      tone: "emerald",
    },
    {
      icon: AlarmClock,
      label: "Tareas vencidas",
      value: totals.overdueTasks,
      detail: `${totals.todayTasks} para hoy`,
      tone: totals.overdueTasks > 0 ? "rose" : "neutral",
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
