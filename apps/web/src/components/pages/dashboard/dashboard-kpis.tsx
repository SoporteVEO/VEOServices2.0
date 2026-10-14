"use client";

import {
  Building2,
  CalendarClock,
  CircleCheck,
  DollarSign,
  Gauge,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";
import { formatMoney } from "@/lib/format";

import type { DashboardKpis } from "@/api/billboards/billboards.get";

interface DashboardKpisProps {
  kpis: DashboardKpis | undefined;
  isLoading: boolean;
}

export function DashboardKpisRow({ kpis, isLoading }: DashboardKpisProps) {
  if (isLoading || !kpis) {
    return <KpiGridSkeleton count={6} />;
  }

  const items: KpiItem[] = [
    {
      icon: DollarSign,
      label: "Ingresos facturados",
      value: kpis.estimatedRevenue,
      prefix: "USD ",
      detail:
        kpis.uniqueCustomers > 0
          ? `Promedio: ${formatMoney(kpis.averageContractValue)}/factura`
          : "Sin facturas en el rango",
      tone: "emerald",
    },
    {
      icon: Gauge,
      label: "Ocupación",
      value: kpis.occupancyRate * 100,
      suffix: "%",
      decimals: 1,
      detail: `${kpis.occupiedBillboards} ocupadas · ${kpis.availableBillboards} libres`,
      tone:
        kpis.occupancyRate >= 0.7
          ? "emerald"
          : kpis.occupancyRate >= 0.4
            ? "amber"
            : "rose",
    },
    {
      icon: Building2,
      label: "Vallas totales",
      value: kpis.totalBillboards,
      detail: `${kpis.availableBillboards} disponibles ahora`,
      tone: "primary",
    },
    {
      icon: TrendingUp,
      label: "Contratos en rango",
      value: kpis.totalContracts,
      detail: `${kpis.activeContractsToday} activos hoy`,
      tone: "violet",
    },
    {
      icon: Users,
      label: "Clientes únicos",
      value: kpis.uniqueCustomers,
      detail:
        kpis.uniqueCustomers === 0 ? "Sin clientes" : "Facturaron en el rango",
      tone: "sky",
    },
    {
      icon: kpis.endingSoon > 0 ? CalendarClock : CircleCheck,
      label: "Por vencer (30 días)",
      value: kpis.endingSoon,
      detail:
        kpis.endingSoon > 0
          ? "Oportunidad de renovación"
          : "Sin vencimientos próximos",
      tone: kpis.endingSoon > 0 ? "amber" : "emerald",
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
