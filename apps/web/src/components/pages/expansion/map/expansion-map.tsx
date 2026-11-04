"use client";

import type { Ref } from "react";
import { MousePointerClick } from "lucide-react";
import type { ExpansionScreen, ExpansionSite } from "@/api/expansion/expansion.types";
import {
  Map,
  MapControls,
  MapMarker,
  MapPopup,
  MarkerContent,
  type MapRef,
} from "@/components/primitives/ui/map";
import { SV_CENTER } from "@/components/pages/crm/inventory/inventory-format";
import { BASE_LAYERS, SITE_STATUS_META } from "../expansion-const";
import type { MappedBillboard } from "../expansion-analysis";
import { analyzeLocation } from "../expansion-location-score";
import type { ActiveItem, LatLng } from "../expansion-types";
import { FitOnce, PlacementEvents } from "./expansion-map-events";
import { CoverageLayer, HeatmapLayers } from "./expansion-map-layers";
import { ExpansionMapLegend } from "./expansion-map-legend";
import {
  BillboardMarkers,
  ScreenMarkers,
  SiteMarkers,
  SitePin,
} from "./expansion-map-markers";
import { BillboardPopupContent, SitePopupContent } from "./expansion-map-popups";
import {
  ExpansionMapActions,
  ExpansionMapToolbar,
  type ToolbarState,
} from "./expansion-map-toolbar";
import { POPUP_OFFSET } from "./marker-colors";

const POPUP_ANALYSIS_RADIUS_KM = 2;

interface Props {
  ref?: Ref<MapRef>;
  isLoading: boolean;
  billboards: MappedBillboard[];
  screens: ExpansionScreen[];
  sites: ExpansionSite[];
  periodMonths: number;
  years: number[];
  toolbar: ToolbarState;
  onToolbarChange: (patch: Partial<ToolbarState>) => void;
  active: ActiveItem | null;
  onActiveChange: (active: ActiveItem | null) => void;
  onOpenDetail: (item: ActiveItem) => void;
  placing: boolean;
  onTogglePlacing: () => void;
  draft: LatLng | null;
  onPick: (point: LatLng) => void;
  onMoveSite: (site: ExpansionSite, point: LatLng) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
}

export function ExpansionMap({
  ref,
  isLoading,
  billboards,
  screens,
  sites,
  periodMonths,
  years,
  toolbar,
  onToolbarChange,
  active,
  onActiveChange,
  onOpenDetail,
  placing,
  onTogglePlacing,
  draft,
  onPick,
  onMoveSite,
  expanded,
  onToggleExpanded,
  panelOpen,
  onTogglePanel,
}: Props) {
  const { layers, colorMode } = toolbar;
  const activeBillboard =
    active?.kind === "billboard" ? billboards.find((b) => b.billboardId === active.id) : undefined;
  const activeSite = active?.kind === "site" ? sites.find((s) => s.id === active.id) : undefined;
  const occupancyBased = billboards.filter((b) => b.basis === "OCCUPANCY").length;

  return (
    <Map
      ref={ref}
      center={SV_CENTER}
      zoom={8}
      loading={isLoading}
      styles={BASE_LAYERS[toolbar.baseLayer].styles}
    >
      <FitOnce billboards={billboards} />
      <PlacementEvents placing={placing} onPick={onPick} />

      {layers.coverage ? (
        <CoverageLayer billboards={billboards} radiusMeters={toolbar.coverageRadius} />
      ) : null}
      <HeatmapLayers
        billboards={billboards}
        profit={layers.profitHeat}
        density={layers.densityHeat}
      />

      {layers.screens ? <ScreenMarkers screens={screens} /> : null}
      {layers.billboards ? (
        <BillboardMarkers
          billboards={billboards}
          clustered={layers.clusters}
          colorMode={colorMode}
          activeId={activeBillboard?.billboardId ?? null}
          onSelect={(b) => onActiveChange({ kind: "billboard", id: b.billboardId })}
        />
      ) : null}
      {layers.sites ? (
        <SiteMarkers
          sites={sites}
          activeId={activeSite?.id ?? null}
          onSelect={(site) => onActiveChange({ kind: "site", id: site.id })}
          onMove={(site, lngLat) => onMoveSite(site, { latitude: lngLat.lat, longitude: lngLat.lng })}
        />
      ) : null}

      {draft ? (
        <MapMarker longitude={draft.longitude} latitude={draft.latitude} anchor="bottom">
          <MarkerContent>
            <SitePin statusColor={SITE_STATUS_META.PROPOSED.color} pulsing />
          </MarkerContent>
        </MapMarker>
      ) : null}

      {activeBillboard ? (
        <MapPopup
          key={`billboard-${activeBillboard.billboardId}`}
          longitude={activeBillboard.longitude}
          latitude={activeBillboard.latitude}
          offset={POPUP_OFFSET}
          closeOnClick={false}
          closeButton
          onClose={() => onActiveChange(null)}
          className="w-76 max-w-none"
        >
          <BillboardPopupContent
            billboard={activeBillboard}
            onOpen={() => onOpenDetail({ kind: "billboard", id: activeBillboard.billboardId })}
          />
        </MapPopup>
      ) : null}

      {activeSite ? (
        <MapPopup
          key={`site-${activeSite.id}-${activeSite.latitude}-${activeSite.longitude}`}
          longitude={activeSite.longitude}
          latitude={activeSite.latitude}
          offset={POPUP_OFFSET}
          closeOnClick={false}
          closeButton
          onClose={() => onActiveChange(null)}
          className="w-76 max-w-none"
        >
          <SitePopupContent
            site={activeSite}
            analysis={analyzeLocation(
              activeSite,
              billboards,
              periodMonths,
              POPUP_ANALYSIS_RADIUS_KM,
              activeSite.locationContext,
            )}
            onOpen={() => onOpenDetail({ kind: "site", id: activeSite.id })}
          />
        </MapPopup>
      ) : null}

      <div className="@container pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start gap-2">
        <ExpansionMapToolbar state={toolbar} onChange={onToolbarChange} years={years} />
        <ExpansionMapActions
          billboards={billboards}
          placing={placing}
          onTogglePlacing={onTogglePlacing}
          expanded={expanded}
          onToggleExpanded={onToggleExpanded}
          panelOpen={panelOpen}
          onTogglePanel={onTogglePanel}
        />
        {placing ? (
          <div className="flex basis-full justify-center">
            <div className="flex items-center gap-2 rounded-full border bg-background/95 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm">
              <MousePointerClick className="size-4 shrink-0 text-violet-600" />
              Haz clic en el mapa para ubicar el nuevo sitio
              <kbd className="rounded border bg-muted px-1.5 text-[11px] text-muted-foreground">
                Esc
              </kbd>
            </div>
          </div>
        ) : null}
      </div>

      <ExpansionMapLegend
        colorMode={colorMode}
        layers={layers}
        occupancyBasedCount={occupancyBased}
      />
      <MapControls position="bottom-right" showZoom showCompass showLocate />
    </Map>
  );
}
