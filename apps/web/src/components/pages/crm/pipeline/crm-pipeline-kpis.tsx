"use client";

import { Briefcase, CircleDollarSign, Scale } from "lucide-react";
import type { CrmBoard } from "@/api/crm/crm.types";
import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";

interface Props {
  board: CrmBoard | undefined;
}

export function CrmPipelineKpis({ board }: Props) {
  if (!board) return <KpiGridSkeleton count={3} className="sm:grid-cols-3" />;

  const openDeals = board.deals.filter((deal) => deal.status === "OPEN");
  const openValue = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = openDeals.reduce(
    (sum, deal) => sum + (deal.value * deal.stage.probability) / 100,
    0,
  );

  const items: KpiItem[] = [
    {
      icon: Briefcase,
      label: "Negocios abiertos",
      value: openDeals.length,
      detail: `${board.deals.length} en total`,
    },
    {
      icon: CircleDollarSign,
      label: "Valor en pipeline",
      value: openValue,
      prefix: "$",
      detail: "Suma de negocios abiertos",
      tone: "sky",
    },
    {
      icon: Scale,
      label: "Pipeline ponderado",
      value: weighted,
      prefix: "$",
      detail: "Valor × probabilidad de la etapa",
      tone: "violet",
    },
  ];

  return (
    <KpiGrid className="sm:grid-cols-3">
      {items.map((item) => (
        <KpiTile key={item.label} item={item} />
      ))}
    </KpiGrid>
  );
}
