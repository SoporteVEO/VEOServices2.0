"use client";

import { useEffect, type Ref } from "react";
import type { Offset } from "maplibre-gl";
import { Check, Scan } from "lucide-react";
import type { InventoryItem } from "@/api/crm/crm-ooh.types";
import {
  Map,
  MapControls,
  MapMarker,
  MapPopup,
  MarkerContent,
  MarkerTooltip,
  useMap,
  type MapRef,
} from "@/components/primitives/ui/map";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INVENTORY_STATE_MARKER_STYLES } from "../crm-ooh-const";
import { CrmInventoryMapPopup } from "./crm-inventory-map-popup";
import {
  SV_CENTER,
  formatLabel,
  inventoryBounds,
  isMappable,
  type MappableItem,
} from "./inventory-format";
import type { InventorySelection } from "./inventory-state";
import { OohFormatIcon } from "./ooh-format-icon";
import { useInventoryClusters, type InventoryCluster } from "./use-inventory-clusters";

const MARKER_HEIGHT = 44;

/** Markers are anchored at their tip, so popups clear the icon above the point. */
const POPUP_OFFSET: Offset = {
  center: [0, -MARKER_HEIGHT / 2],
  top: [0, 6],
  "top-left": [0, 6],
  "top-right": [0, 6],
  bottom: [0, -MARKER_HEIGHT],
  "bottom-left": [0, -MARKER_HEIGHT],
  "bottom-right": [0, -MARKER_HEIGHT],
  left: [22, -MARKER_HEIGHT / 2],
  right: [-22, -MARKER_HEIGHT / 2],
};

const FIT_OPTIONS = { padding: 56, maxZoom: 14, duration: 600 };

interface Props {
  ref?: Ref<MapRef>;
  items: InventoryItem[];
  isLoading: boolean;
  selection: InventorySelection;
  activeKey: string | null;
  onActiveChange: (key: string | null) => void;
  onToggle: (item: InventoryItem) => void;
}

export function CrmInventoryMap({
  ref,
  items,
  isLoading,
  selection,
  activeKey,
  onActiveChange,
  onToggle,
}: Props) {
  const mappable = items.filter(isMappable);
  const active = mappable.find((item) => item.key === activeKey) ?? null;
  const missing = items.length - mappable.length;

  return (
    <Map ref={ref} center={SV_CENTER} zoom={8} loading={isLoading}>
      <FitToItems items={mappable} />
      <InventoryMarkers
        items={mappable}
        selection={selection}
        activeKey={activeKey}
        onActiveChange={onActiveChange}
      />

      {active ? (
        <MapPopup
          key={active.key}
          longitude={active.longitude}
          latitude={active.latitude}
          offset={POPUP_OFFSET}
          closeOnClick={false}
          closeButton
          onClose={() => onActiveChange(null)}
          className="w-72 max-w-none"
        >
          <CrmInventoryMapPopup
            item={active}
            selected={selection[active.key] !== undefined}
            onToggle={() => onToggle(active)}
          />
        </MapPopup>
      ) : null}

      <div className="pointer-events-none absolute top-2 left-2 z-10 rounded-md border bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-xs">
        <span className="font-medium text-foreground tabular-nums">{mappable.length}</span> en el
        mapa
        {missing > 0 ? ` · ${missing} sin ubicación` : ""}
      </div>
      <FitButton items={mappable} />
      <MapControls position="bottom-right" showZoom showFullscreen />
    </Map>
  );
}

function InventoryMarkers({
  items,
  selection,
  activeKey,
  onActiveChange,
}: {
  items: MappableItem[];
  selection: InventorySelection;
  activeKey: string | null;
  onActiveChange: (key: string) => void;
}) {
  const { points, clusters, expand } = useInventoryClusters(items);

  return (
    <>
      {clusters.map((cluster) => (
        <MapMarker
          key={`cluster-${cluster.id}`}
          longitude={cluster.longitude}
          latitude={cluster.latitude}
          onClick={() => expand(cluster)}
        >
          <MarkerContent>
            <ClusterBubble cluster={cluster} />
          </MarkerContent>
          <MarkerTooltip>
            {cluster.count} sitios · {cluster.available} disponibles
          </MarkerTooltip>
        </MapMarker>
      ))}
      {points.map((item) => (
        <MapMarker
          key={item.key}
          longitude={item.longitude}
          latitude={item.latitude}
          anchor="bottom"
          onClick={() => onActiveChange(item.key)}
        >
          <MarkerContent>
            <InventoryMarker
              item={item}
              active={item.key === activeKey}
              selected={item.inDeal || selection[item.key] !== undefined}
            />
          </MarkerContent>
          <MarkerTooltip offset={POPUP_OFFSET}>
            {item.code} · {formatLabel(item)}
          </MarkerTooltip>
        </MapMarker>
      ))}
    </>
  );
}

function ClusterBubble({ cluster }: { cluster: InventoryCluster }) {
  const size = cluster.count >= 50 ? "size-12" : cluster.count >= 10 ? "size-10" : "size-8";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full border-2 border-white bg-foreground text-xs font-semibold text-background tabular-nums shadow-md ring-4 ring-foreground/15 transition-transform hover:scale-110",
        size,
      )}
    >
      {cluster.count}
      {cluster.available > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] leading-none text-white ring-2 ring-white">
          {cluster.available}
        </span>
      ) : null}
    </div>
  );
}

function InventoryMarker({
  item,
  active,
  selected,
}: {
  item: MappableItem;
  active: boolean;
  selected: boolean;
}) {
  const unavailable = item.state === "CONTRACTED" || item.state === "FULL";

  return (
    <div
      className={cn(
        "relative flex origin-bottom flex-col items-center transition-transform duration-150 hover:scale-110",
        INVENTORY_STATE_MARKER_STYLES[item.state],
        active && "scale-125 hover:scale-125",
        unavailable && !active && "opacity-70",
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-md border-2 border-current bg-white shadow-md",
          active && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        )}
      >
        <OohFormatIcon item={item} size={28} />
      </div>
      <span className="-mt-px size-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-current" />
      {selected ? (
        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-white">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      ) : null}
    </div>
  );
}

/** Re-frames the camera whenever the filtered result set covers a different area. */
function FitToItems({ items }: { items: MappableItem[] }) {
  const { map, isLoaded } = useMap();
  const boundsKey = JSON.stringify(inventoryBounds(items));

  useEffect(() => {
    const bounds = JSON.parse(boundsKey);
    if (!map || !isLoaded || !bounds) return;
    map.fitBounds(bounds, FIT_OPTIONS);
  }, [map, isLoaded, boundsKey]);

  return null;
}

function FitButton({ items }: { items: MappableItem[] }) {
  const { map } = useMap();
  const bounds = inventoryBounds(items);

  return (
    <div className="absolute top-2 right-2 z-10">
      <Button
        variant="outline"
        sizeVariant="sm"
        icon={Scan}
        className="bg-background shadow-sm"
        disabled={!bounds}
        onClick={() => bounds && map?.fitBounds(bounds, FIT_OPTIONS)}
      >
        Ver todos
      </Button>
    </div>
  );
}
