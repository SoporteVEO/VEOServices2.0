"use client";

import { MapPinPlus, Monitor } from "lucide-react";
import type { ExpansionScreen, ExpansionSite } from "@/api/expansion/expansion.types";
import { MapMarker, MarkerContent, MarkerTooltip } from "@/components/primitives/ui/map";
import { formatLabel } from "@/components/pages/crm/inventory/inventory-format";
import { OohFormatIcon } from "@/components/pages/crm/inventory/ooh-format-icon";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  SCREEN_COLOR,
  SITE_COLOR,
  SITE_STATUS_META,
  formatPercent,
  type ColorMode,
} from "../expansion-const";
import type { MappedBillboard } from "../expansion-analysis";
import { POPUP_OFFSET, billboardColor, clusterColor } from "./marker-colors";
import { useBillboardClusters, type BillboardCluster } from "./use-billboard-clusters";

export function BillboardMarkers({
  billboards,
  clustered,
  colorMode,
  activeId,
  onSelect,
}: {
  billboards: MappedBillboard[];
  clustered: boolean;
  colorMode: ColorMode;
  activeId: number | null;
  onSelect: (billboard: MappedBillboard) => void;
}) {
  const { points, clusters, expand } = useBillboardClusters(billboards, clustered);

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
            <ClusterBubble cluster={cluster} color={clusterColor(cluster, colorMode)} />
          </MarkerContent>
          <MarkerTooltip>
            {cluster.count} vallas · rentabilidad {Math.round(cluster.avgScore)} · ocupación{" "}
            {formatPercent(cluster.avgOccupancy)}
          </MarkerTooltip>
        </MapMarker>
      ))}
      {points.map((billboard) => (
        <MapMarker
          key={billboard.billboardId}
          longitude={billboard.longitude}
          latitude={billboard.latitude}
          anchor="bottom"
          onClick={() => onSelect(billboard)}
        >
          <MarkerContent>
            <BillboardPin
              billboard={billboard}
              color={billboardColor(billboard, colorMode)}
              active={billboard.billboardId === activeId}
            />
          </MarkerContent>
          <MarkerTooltip offset={POPUP_OFFSET}>
            {billboard.code} · {formatLabel({ kind: "STATIC", ...billboard })} · rentabilidad{" "}
            {billboard.score}
          </MarkerTooltip>
        </MapMarker>
      ))}
    </>
  );
}

function ClusterBubble({ cluster, color }: { cluster: BillboardCluster; color: string }) {
  const size = cluster.count >= 50 ? "size-12" : cluster.count >= 10 ? "size-10" : "size-8";

  return (
    <div
      style={{ backgroundColor: color, boxShadow: `0 0 0 5px ${color}33` }}
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white tabular-nums shadow-md transition-transform hover:scale-110",
        size,
      )}
    >
      {cluster.count}
    </div>
  );
}

function BillboardPin({
  billboard,
  color,
  active,
}: {
  billboard: MappedBillboard;
  color: string;
  active: boolean;
}) {
  return (
    <div
      style={{ color }}
      className={cn(
        "relative flex origin-bottom flex-col items-center transition-transform duration-150 hover:scale-110",
        active && "scale-125 hover:scale-125",
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-md border-[3px] border-current bg-white shadow-md",
          active && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        )}
      >
        <OohFormatIcon item={{ kind: "STATIC", ...billboard }} size={26} />
      </div>
      <span className="-mt-px size-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-current" />
      {billboard.occupiedNow ? (
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary ring-2 ring-white" />
      ) : null}
    </div>
  );
}

export function SiteMarkers({
  sites,
  activeId,
  onSelect,
  onMove,
}: {
  sites: ExpansionSite[];
  activeId: string | null;
  onSelect: (site: ExpansionSite) => void;
  onMove: (site: ExpansionSite, lngLat: { lng: number; lat: number }) => void;
}) {
  return sites.map((site) => (
    <MapMarker
      key={site.id}
      longitude={site.longitude}
      latitude={site.latitude}
      anchor="bottom"
      draggable
      onClick={() => onSelect(site)}
      onDragEnd={(lngLat) => onMove(site, lngLat)}
    >
      <MarkerContent>
        <SitePin
          statusColor={SITE_STATUS_META[site.status].color}
          active={site.id === activeId}
          dimmed={site.status === "DISCARDED"}
        />
      </MarkerContent>
      <MarkerTooltip offset={POPUP_OFFSET}>
        {site.code} · {site.name} · {SITE_STATUS_META[site.status].label}
      </MarkerTooltip>
    </MapMarker>
  ));
}

export function SitePin({
  statusColor,
  active = false,
  dimmed = false,
  pulsing = false,
}: {
  statusColor: string;
  active?: boolean;
  dimmed?: boolean;
  pulsing?: boolean;
}) {
  return (
    <div
      style={{ color: SITE_COLOR }}
      className={cn(
        "relative flex origin-bottom cursor-grab flex-col items-center transition-transform duration-150 hover:scale-110 active:cursor-grabbing",
        active && "scale-125 hover:scale-125",
        dimmed && !active && "opacity-60",
      )}
    >
      {pulsing ? (
        <span className="absolute top-0 size-9 animate-ping rounded-full bg-current opacity-40" />
      ) : null}
      <div
        style={{ borderColor: statusColor }}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-full border-[3px] border-dashed bg-current text-white shadow-lg",
          active && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        )}
      >
        <MapPinPlus className="size-4.5" />
      </div>
      <span className="-mt-px size-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-current" />
    </div>
  );
}

export function ScreenMarkers({ screens }: { screens: ExpansionScreen[] }) {
  return screens.map((screen) => (
    <MapMarker key={screen.id} longitude={screen.longitude} latitude={screen.latitude}>
      <MarkerContent>
        <div
          style={{ backgroundColor: SCREEN_COLOR }}
          className="flex size-6 items-center justify-center rounded-md border-2 border-white text-white shadow-md transition-transform hover:scale-110"
        >
          <Monitor className="size-3.5" />
        </div>
      </MarkerContent>
      <MarkerTooltip>
        {screen.code} · {screen.name} · {formatPrice(screen.price)}/mes
      </MarkerTooltip>
    </MapMarker>
  ));
}
