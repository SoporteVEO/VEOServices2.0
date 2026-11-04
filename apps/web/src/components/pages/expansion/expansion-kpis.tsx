import {
  BadgeDollarSign,
  CalendarCheck,
  Gauge,
  MapPinPlus,
  Signpost,
  Wallet,
} from "lucide-react";
import type { ExpansionSite } from "@/api/expansion/expansion.types";
import { KpiGrid, KpiGridSkeleton, KpiTile, type KpiItem } from "@/components/ui/kpi-tile";
import type { MappedBillboard } from "./expansion-analysis";

export function ExpansionKpis({
  billboards,
  sites,
  periodLabel,
  isLoading,
}: {
  billboards: MappedBillboard[];
  sites: ExpansionSite[];
  periodLabel: string;
  isLoading: boolean;
}) {
  if (isLoading) return <KpiGridSkeleton count={6} />;

  const count = billboards.length;
  const avg = (pick: (b: MappedBillboard) => number) =>
    count > 0 ? billboards.reduce((sum, b) => sum + pick(b), 0) / count : 0;
  const revenue = billboards.reduce((sum, b) => sum + b.revenue, 0);
  const withCost = billboards.filter((b) => b.monthlyCost != null).length;
  const occupiedNow = billboards.filter((b) => b.occupiedNow).length;
  const highTier = billboards.filter((b) => b.tier === "HIGH").length;
  const activeSites = sites.filter((s) => s.status !== "DISCARDED").length;

  const items: KpiItem[] = [
    {
      icon: Signpost,
      label: "Vallas en el mapa",
      value: count,
      detail: `${occupiedNow} contratadas hoy`,
      tone: "primary",
    },
    {
      icon: Gauge,
      label: "Rentabilidad promedio",
      value: avg((b) => b.score),
      detail: `${highTier} vallas con rentabilidad alta`,
      tone: "emerald",
    },
    {
      icon: CalendarCheck,
      label: "Ocupación promedio",
      value: avg((b) => b.occupancyRate) * 100,
      suffix: "%",
      detail: periodLabel,
      tone: "sky",
    },
    {
      icon: BadgeDollarSign,
      label: "Ingresos del período",
      value: revenue,
      prefix: "$",
      detail: periodLabel,
      tone: "amber",
    },
    {
      icon: Wallet,
      label: "Vallas con costo",
      value: withCost,
      detail: count > 0 ? `${Math.round((withCost / count) * 100)}% del inventario` : undefined,
      tone: "neutral",
    },
    {
      icon: MapPinPlus,
      label: "Ubicaciones planificadas",
      value: activeSites,
      detail: `${sites.filter((s) => s.status === "APPROVED").length} aprobadas`,
      tone: "violet",
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
