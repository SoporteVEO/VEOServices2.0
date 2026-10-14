"use client";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Wallet,
} from "lucide-react";

import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";

import type {
  MyContractsSnapshot,
  MyReportsTrend,
} from "@/api/contracts/contracts.get";
import type { MyOffersSummary } from "@/api/offers/offers.types";

interface MySpaceKpisProps {
  offers?: MyOffersSummary;
  contracts?: MyContractsSnapshot;
  reports?: MyReportsTrend;
  isLoading: boolean;
}

export function MySpaceKpisRow({
  offers,
  contracts,
  reports,
  isLoading,
}: MySpaceKpisProps) {
  if (isLoading || !offers || !contracts || !reports) {
    return <KpiGridSkeleton count={6} />;
  }

  const acceptedAmount =
    offers.byStatus.accepted.totalRental +
    offers.byStatus.accepted.totalImpression;
  const pendingAmount =
    offers.byStatus.pending.totalRental +
    offers.byStatus.pending.totalImpression;

  const items: KpiItem[] = [
    {
      icon: ClipboardList,
      label: "Contratos activos",
      value: contracts.activeCount,
      detail:
        contracts.activeCount === 0
          ? "Sin contratos activos"
          : "Asignados a tu nombre",
      tone: "primary",
    },
    {
      icon: CheckCircle2,
      label: "Reportes enviados",
      value: contracts.reportsSentThisMonth,
      detail: `En el rango · de ${contracts.activeCount} contrato${
        contracts.activeCount === 1 ? "" : "s"
      }`,
      tone: "emerald",
    },
    {
      icon: AlertCircle,
      label: "Reportes pendientes",
      value: contracts.reportsPendingThisMonth,
      detail:
        contracts.reportsPendingThisMonth > 0
          ? "Por enviar en el rango"
          : "Todos al día",
      tone: contracts.reportsPendingThisMonth > 0 ? "amber" : "emerald",
    },
    {
      icon: FileText,
      label: "Cotizaciones creadas",
      value: offers.totals.count,
      detail: `Aceptadas: ${offers.byStatus.accepted.count} · Pendientes: ${offers.byStatus.pending.count}`,
      tone: "violet",
    },
    {
      icon: Wallet,
      label: "Ventas (aceptadas)",
      value: acceptedAmount,
      prefix: "USD ",
      detail:
        offers.byStatus.accepted.count === 0
          ? "Sin cotizaciones aceptadas"
          : `${offers.byStatus.accepted.count} cotización${
              offers.byStatus.accepted.count === 1 ? "" : "es"
            } aceptada${offers.byStatus.accepted.count === 1 ? "" : "s"}`,
      tone: "sky",
    },
    {
      icon: Clock,
      label: "Monto pendiente",
      value: pendingAmount,
      prefix: "USD ",
      detail:
        offers.byStatus.pending.count === 0
          ? "Sin cotizaciones pendientes"
          : `${offers.byStatus.pending.count} cotización${
              offers.byStatus.pending.count === 1 ? "" : "es"
            } esperando respuesta`,
      tone: pendingAmount > 0 ? "amber" : "primary",
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

