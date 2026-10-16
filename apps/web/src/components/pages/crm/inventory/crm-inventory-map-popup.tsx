"use client";

import { AlertTriangle, Check, ExternalLink, Plus } from "lucide-react";
import type { InventoryItem } from "@/api/crm/crm-ooh.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { INVENTORY_STATE_LABELS, INVENTORY_STATE_STYLES } from "../crm-ooh-const";
import { mapsLink, sizeLabel } from "../crm-ooh-format";
import { CrmInventoryHolds } from "./crm-inventory-holds";
import { CrmInventoryPopupImages } from "./crm-inventory-popup-images";
import { formatLabel } from "./inventory-format";
import { OohFormatIcon } from "./ooh-format-icon";

interface Props {
  item: InventoryItem;
  selected: boolean;
  onToggle: () => void;
}

export function CrmInventoryMapPopup({ item, selected, onToggle }: Props) {
  const location = [item.cityName, item.departmentName].filter(Boolean).join(", ");
  const size = sizeLabel(item.width, item.height);
  const maps = mapsLink(item.latitude, item.longitude);

  const details: [string, string | null][] = [
    ["Ubicación", location || null],
    ["Medidas", size],
    ["Estructura", item.kind === "STATIC" ? item.structureName : null],
    [
      "Spots libres",
      item.kind === "DIGITAL" && item.capacity != null
        ? `${item.freeSpots ?? 0}/${item.capacity}`
        : null,
    ],
    ["Tarifa", item.rate > 0 ? `${formatMoney(item.rate)}/mes` : "Sin tarifa"],
  ];

  return (
    <div className="flex flex-col gap-3">
      {item.kind === "STATIC" ? <CrmInventoryPopupImages key={item.key} code={item.code} /> : null}
      <div className="flex items-start gap-3 pe-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-white">
          <OohFormatIcon item={item} size={40} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {formatLabel(item)}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold tabular-nums">{item.code}</span>
            <Badge variant="outline" className={INVENTORY_STATE_STYLES[item.state]}>
              {INVENTORY_STATE_LABELS[item.state]}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-xs leading-snug text-foreground">{item.label}</p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        {details
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-end tabular-nums">{value}</dd>
            </div>
          ))}
      </dl>

      {item.competitorConflict ? (
        <Badge variant="warning" className="gap-1 self-start">
          <AlertTriangle className="size-3" />
          Competencia en el periodo
        </Badge>
      ) : null}
      {item.holds.length > 0 ? <CrmInventoryHolds holds={item.holds} /> : null}

      <div className="flex gap-2">
        <Button
          sizeVariant="sm"
          variant={selected ? "outline" : "default"}
          icon={selected || item.inDeal ? Check : Plus}
          className="flex-1"
          disabled={item.inDeal}
          onClick={onToggle}
        >
          {item.inDeal ? "Ya en el negocio" : selected ? "Seleccionada" : "Seleccionar"}
        </Button>
        {maps ? (
          <Button variant="outline" sizeVariant="sm" asChild>
            <a href={maps} target="_blank" rel="noreferrer" aria-label="Abrir en Google Maps">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
