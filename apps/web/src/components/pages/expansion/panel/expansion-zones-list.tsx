"use client";

import { Badge } from "@/components/primitives/ui/badge";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TIER_META, formatPercent, scoreTier } from "../expansion-const";
import { SATURATION_LABELS, type Saturation, type ZoneSummary } from "../expansion-analysis";
import { ScoreBar } from "../expansion-badges";

const SATURATION_BADGE: Record<Saturation, "info" | "ghost" | "warning"> = {
  UNDERSERVED: "info",
  BALANCED: "ghost",
  SATURATED: "warning",
};

export function ExpansionZonesList({
  zones,
  onSelect,
}: {
  zones: ZoneSummary[];
  onSelect: (zone: ZoneSummary) => void;
}) {
  if (zones.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        No hay vallas con ubicación para agrupar por zona.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
      <p className="text-xs text-muted-foreground">
        Departamentos ordenados por ingresos. Una zona es saturada cuando concentra muchas vallas
        con baja ocupación, y desatendida cuando tiene poca presencia o demanda alta.
      </p>
      <ul className="flex flex-col gap-2">
        {zones.map((zone) => {
          const color = TIER_META[scoreTier(zone.avgScore)].color;
          return (
            <li key={zone.name}>
              <button
                type="button"
                onClick={() => onSelect(zone)}
                className="flex w-full cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:border-border-strong"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{zone.name}</span>
                  <Badge variant={SATURATION_BADGE[zone.saturation]}>
                    {SATURATION_LABELS[zone.saturation]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreBar value={zone.avgScore} color={color} />
                  <span className="w-8 text-right text-xs font-semibold tabular-nums" style={{ color }}>
                    {Math.round(zone.avgScore)}
                  </span>
                </div>
                <dl className="grid grid-cols-4 gap-2 text-xs">
                  <ZoneStat label="Vallas" value={String(zone.count)} />
                  <ZoneStat label="Ocupación" value={formatPercent(zone.avgOccupancy)} />
                  <ZoneStat label="Ingresos" value={formatMoney(zone.revenue)} />
                  <ZoneStat
                    label="Planif."
                    value={String(zone.plannedSites)}
                    highlight={zone.plannedSites > 0}
                  />
                </dl>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ZoneStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn("truncate font-medium tabular-nums", highlight && "text-violet-600")}>
        {value}
      </dd>
    </div>
  );
}
