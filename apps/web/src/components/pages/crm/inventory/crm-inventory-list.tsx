"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { InventoryHold, InventoryItem, InventoryState } from "@/api/crm/crm-ooh.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { Input } from "@/components/primitives/ui/input";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { calendarDate } from "../crm-format";
import {
  INVENTORY_STATE_LABELS,
  INVENTORY_STATE_STYLES,
  SITE_KIND_ICONS,
} from "../crm-ooh-const";
import { mapsLink, sizeLabel } from "../crm-ooh-format";
import type { InventorySelection } from "./inventory-state";

const STATE_ORDER: InventoryState[] = ["AVAILABLE", "HELD", "BOOKED", "CONTRACTED", "FULL"];

interface Props {
  items: InventoryItem[];
  totals?: Record<InventoryState, number>;
  isLoading: boolean;
  truncated?: boolean;
  selection: InventorySelection;
  onToggle: (item: InventoryItem) => void;
  onSpotsChange: (key: string, spotsPerDay: number) => void;
}

export function CrmInventoryList({
  items,
  totals,
  isLoading,
  truncated,
  selection,
  onToggle,
  onSpotsChange,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {totals ? (
        <div className="flex flex-wrap gap-1.5">
          {STATE_ORDER.filter((state) => totals[state] > 0).map((state) => (
            <Badge key={state} variant="outline" className={INVENTORY_STATE_STYLES[state]}>
              {INVENTORY_STATE_LABELS[state]} · {totals[state]}
            </Badge>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay sitios que coincidan con los filtros.
        </p>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {items.map((item) => (
            <InventoryRow
              key={item.key}
              item={item}
              selectedSpots={selection[item.key]?.spotsPerDay}
              onToggle={() => onToggle(item)}
              onSpotsChange={(spots) => onSpotsChange(item.key, spots)}
            />
          ))}
        </ul>
      )}
      {truncated ? (
        <p className="text-xs text-muted-foreground">
          Mostrando los primeros resultados. Refina la búsqueda para ver más.
        </p>
      ) : null}
    </div>
  );
}

function InventoryRow({
  item,
  selectedSpots,
  onToggle,
  onSpotsChange,
}: {
  item: InventoryItem;
  selectedSpots: number | undefined;
  onToggle: () => void;
  onSpotsChange: (spots: number) => void;
}) {
  const selected = selectedSpots !== undefined;
  const Icon = SITE_KIND_ICONS[item.kind];
  const location = [item.cityName, item.departmentName].filter(Boolean).join(", ");
  const size = sizeLabel(item.width, item.height);
  const maps = mapsLink(item.latitude, item.longitude);

  return (
    <li
      className={cn(
        "flex items-start gap-3 p-3 text-sm transition-colors",
        selected && "bg-accent/40",
        item.inDeal && "opacity-60",
      )}
    >
      <Checkbox
        className="mt-0.5"
        checked={selected || item.inDeal}
        disabled={item.inDeal}
        onCheckedChange={onToggle}
        aria-label={`Seleccionar ${item.code}`}
      />
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold tabular-nums">{item.code}</span>
          <span className="truncate text-muted-foreground">{item.label}</span>
          {maps ? (
            <a
              href={maps}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Ver en mapa"
            >
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          {location ? <span>{location}</span> : null}
          {size ? <span>{size}</span> : null}
          {item.kind === "DIGITAL" && item.capacity != null ? (
            <span>
              {item.freeSpots ?? 0}/{item.capacity} spots libres
            </span>
          ) : null}
          {item.inDeal ? <span className="font-medium text-foreground">Ya en el negocio</span> : null}
        </div>
        {item.holds.length > 0 ? <HoldsLine holds={item.holds} /> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          {item.competitorConflict ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="warning" className="gap-1">
                  <AlertTriangle className="size-3" />
                  Competencia
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Otro negocio de la misma categoría tiene este sitio en el periodo.
              </TooltipContent>
            </Tooltip>
          ) : null}
          <Badge variant="outline" className={INVENTORY_STATE_STYLES[item.state]}>
            {INVENTORY_STATE_LABELS[item.state]}
          </Badge>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {item.rate > 0 ? `${formatMoney(item.rate)}/mes` : "Sin tarifa"}
        </span>
        {selected && item.kind === "DIGITAL" ? (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Spots/día
            <Input
              type="number"
              min={1}
              max={item.capacity ?? undefined}
              value={selectedSpots}
              onChange={(e) => onSpotsChange(Math.max(1, Number(e.target.value) || 1))}
              className="h-7 w-20 text-right"
            />
          </label>
        ) : null}
      </div>
    </li>
  );
}

function HoldsLine({ holds }: { holds: InventoryHold[] }) {
  return (
    <div className="flex flex-col gap-0.5 text-[11px]">
      {holds.slice(0, 3).map((hold) => (
        <span key={hold.siteId} className="truncate text-violet-700 dark:text-violet-300">
          {hold.status === "BOOKED" ? "Vendida" : `${hold.rank}ª opción`} · {hold.dealTitle} (
          {hold.ownerName})
          {hold.holdUntil && hold.status === "HELD"
            ? ` · hasta ${format(new Date(hold.holdUntil), "d MMM", { locale: es })}`
            : ""}
          {hold.spotsPerDay ? ` · ${hold.spotsPerDay} spots` : ""}
          {` · ${format(calendarDate(hold.startDate), "d MMM", { locale: es })}–${format(calendarDate(hold.endDate), "d MMM", { locale: es })}`}
        </span>
      ))}
      {holds.length > 3 ? (
        <span className="text-muted-foreground">+{holds.length - 3} más</span>
      ) : null}
    </div>
  );
}
