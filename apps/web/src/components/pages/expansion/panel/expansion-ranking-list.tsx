"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/primitives/ui/toggle-group";
import { OohFormatIcon } from "@/components/pages/crm/inventory/ooh-format-icon";
import { formatMoney } from "@/lib/format";
import { formatPercent } from "../expansion-const";
import type { MappedBillboard } from "../expansion-analysis";
import { TierBadge } from "../expansion-badges";

const RANKING_SIZE = 20;

type Direction = "best" | "worst";

export function ExpansionRankingList({
  billboards,
  onSelect,
}: {
  billboards: MappedBillboard[];
  onSelect: (billboard: MappedBillboard) => void;
}) {
  const [direction, setDirection] = useState<Direction>("best");

  const ranked = [...billboards]
    .sort((a, b) =>
      direction === "best" ? b.score - a.score || b.revenue - a.revenue : a.score - b.score || a.revenue - b.revenue,
    )
    .slice(0, RANKING_SIZE);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="px-3">
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          spacing={0}
          value={direction}
          onValueChange={(value) => value && setDirection(value as Direction)}
          className="w-full"
        >
          <ToggleGroupItem value="best" className="flex-1">
            <TrendingUp /> Más rentables
          </ToggleGroupItem>
          <ToggleGroupItem value="worst" className="flex-1">
            <TrendingDown /> Menos rentables
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {ranked.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
          No hay vallas para clasificar.
        </p>
      ) : (
        <ol className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
          {ranked.map((billboard, index) => (
            <li key={billboard.billboardId}>
              <button
                type="button"
                onClick={() => onSelect(billboard)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/60"
              >
                <span className="w-5 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <OohFormatIcon item={{ kind: "STATIC", ...billboard }} size={22} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{billboard.code}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatPercent(billboard.occupancyRate)} ocupación · {formatMoney(billboard.revenue)}
                  </span>
                </span>
                <TierBadge tier={billboard.tier} score={billboard.score} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
