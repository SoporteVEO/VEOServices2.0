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
} from "lucide-react";

import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";

import type { OffersAnalyticsOverview } from "@/api/analytics/analytics.types";

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
    return <KpiGridSkeleton count={KPI_SKELETON_COUNT} />;
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
    <KpiGrid>
      {items.map((item) => (
        <KpiTile key={item.label} item={item} />
      ))}
    </KpiGrid>
  );
}
