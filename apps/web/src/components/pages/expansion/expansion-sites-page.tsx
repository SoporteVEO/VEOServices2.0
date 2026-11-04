"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useExpansionBillboards, useExpansionSites } from "@/api/expansion/expansion.get";
import { useMoveExpansionSite } from "@/api/expansion/expansion.mutations";
import type {
  ExpansionBillboard,
  ExpansionSite,
  ExpansionSiteDetail,
} from "@/api/expansion/expansion.types";
import type { MapRef } from "@/components/primitives/ui/map";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExpansionBillboardDrawer } from "./billboard/expansion-billboard-drawer";
import { DEFAULT_LAYERS } from "./expansion-const";
import {
  isMappedBillboard,
  summarizeZones,
  type MappedBillboard,
  type ZoneSummary,
} from "./expansion-analysis";
import { ExpansionKpis } from "./expansion-kpis";
import type { ActiveItem, LatLng } from "./expansion-types";
import { FIT_OPTIONS } from "./map/expansion-map-events";
import { ExpansionMap } from "./map/expansion-map";
import type { ToolbarState } from "./map/expansion-map-toolbar";
import { ExpansionSidePanel } from "./panel/expansion-side-panel";
import { ExpansionSiteDrawer } from "./site/expansion-site-drawer";
import { ExpansionSiteFormDialog } from "./site/expansion-site-form-dialog";

const LOCATE_ZOOM = 15;
const YEARS_BACK = 3;

type SiteForm = { site: ExpansionSite } | { point: LatLng };

export function ExpansionSitesPage() {
  const mapRef = useRef<MapRef>(null);
  const [toolbar, setToolbar] = useState<ToolbarState>({
    baseLayer: "streets",
    colorMode: "profitability",
    layers: DEFAULT_LAYERS,
    coverageRadius: 500,
    year: null,
  });
  const [active, setActive] = useState<ActiveItem | null>(null);
  const [detail, setDetail] = useState<ActiveItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [siteForm, setSiteForm] = useState<SiteForm | null>(null);
  const [placing, setPlacing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const billboardsQuery = useExpansionBillboards(toolbar.year);
  const sitesQuery = useExpansionSites();
  const moveSite = useMoveExpansionSite();

  const result = billboardsQuery.data;
  const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data]);
  const billboards = useMemo(
    () => (result?.billboards ?? []).filter(isMappedBillboard),
    [result?.billboards],
  );
  const zones = useMemo(() => summarizeZones(billboards, sites), [billboards, sites]);
  const departments = useMemo(
    () => [...new Set(billboards.map((b) => b.departmentName).filter((d): d is string => !!d))].sort(),
    [billboards],
  );
  const periodMonths = result?.period.months ?? 12;
  const periodLabel = result?.period.label ?? "Últimos 12 meses";
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: YEARS_BACK }, (_, i) => currentYear - i);

  const overlayOpen = detailOpen || siteForm != null;
  useEffect(() => {
    if (!placing && !expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || overlayOpen) return;
      if (placing) setPlacing(false);
      else setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [placing, expanded, overlayOpen]);

  function resizeMapSoon() {
    requestAnimationFrame(() => mapRef.current?.resize());
  }

  function flyTo(point: LatLng) {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [point.longitude, point.latitude],
      zoom: Math.max(map.getZoom(), LOCATE_ZOOM),
    });
  }

  function openDetail(item: ActiveItem) {
    setDetail(item);
    setDetailOpen(true);
  }

  function selectSite(site: ExpansionSite) {
    setActive({ kind: "site", id: site.id });
    flyTo(site);
  }

  function selectBillboard(billboard: MappedBillboard) {
    setActive({ kind: "billboard", id: billboard.billboardId });
    flyTo(billboard);
  }

  function selectZone(zone: ZoneSummary) {
    if (zone.bounds) mapRef.current?.fitBounds(zone.bounds, FIT_OPTIONS);
  }

  function locateBillboard(billboard: ExpansionBillboard) {
    setDetailOpen(false);
    if (billboard.latitude == null || billboard.longitude == null) return;
    setActive({ kind: "billboard", id: billboard.billboardId });
    flyTo({ latitude: billboard.latitude, longitude: billboard.longitude });
  }

  function locateSite(site: ExpansionSiteDetail) {
    setDetailOpen(false);
    selectSite(site);
  }

  function handleMoveSite(site: ExpansionSite, point: LatLng) {
    moveSite.mutate(
      { id: site.id, ...point },
      {
        onSuccess: () => toast.success(`${site.code} reubicada.`),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "No se pudo mover la ubicación."),
      },
    );
  }

  function handlePick(point: LatLng) {
    setPlacing(false);
    setActive(null);
    setSiteForm({ point });
  }

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3",
        expanded && "fixed inset-0 z-50 gap-0 bg-background",
      )}
    >
      {expanded ? null : (
        <ExpansionKpis
          billboards={billboards}
          sites={sites}
          periodLabel={periodLabel}
          isLoading={billboardsQuery.isLoading}
        />
      )}

      {billboardsQuery.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">
          No pudimos cargar las vallas desde Brilo. El mapa muestra solo las ubicaciones planificadas.
        </p>
      ) : null}

      <div
        className={cn(
          "flex min-h-0 flex-col gap-3 lg:flex-row",
          expanded ? "flex-1 gap-0" : "lg:h-[max(600px,calc(100svh-15rem))]",
        )}
      >
        <Card
          className={cn(
            "relative h-[560px] min-w-0 overflow-hidden p-0 lg:h-auto lg:flex-1",
            expanded && "h-auto flex-1 rounded-none border-0",
          )}
        >
          <ExpansionMap
            ref={mapRef}
            isLoading={billboardsQuery.isLoading}
            billboards={billboards}
            screens={result?.screens ?? []}
            sites={sites}
            periodMonths={periodMonths}
            years={years}
            toolbar={toolbar}
            onToolbarChange={(patch) => setToolbar((current) => ({ ...current, ...patch }))}
            active={active}
            onActiveChange={setActive}
            onOpenDetail={openDetail}
            placing={placing}
            onTogglePlacing={() => setPlacing((value) => !value)}
            draft={siteForm && "point" in siteForm ? siteForm.point : null}
            onPick={handlePick}
            onMoveSite={handleMoveSite}
            expanded={expanded}
            onToggleExpanded={() => {
              setExpanded((value) => !value);
              resizeMapSoon();
            }}
            panelOpen={panelOpen}
            onTogglePanel={() => {
              setPanelOpen((value) => !value);
              resizeMapSoon();
            }}
          />
        </Card>

        {panelOpen ? (
          <Card
            className={cn(
              "flex h-[520px] min-h-0 flex-col gap-0 overflow-hidden p-0 lg:h-auto lg:w-[380px] lg:shrink-0",
              expanded && "rounded-none border-y-0 border-r-0",
            )}
          >
            <ExpansionSidePanel
              sites={sites}
              sitesLoading={sitesQuery.isLoading}
              sitesError={sitesQuery.isError}
              billboards={billboards}
              zones={zones}
              periodMonths={periodMonths}
              activeSiteId={active?.kind === "site" ? active.id : null}
              onSelectSite={selectSite}
              onSelectZone={selectZone}
              onSelectBillboard={selectBillboard}
            />
          </Card>
        ) : null}
      </div>

      <ExpansionSiteDrawer
        siteId={detail?.kind === "site" ? detail.id : null}
        open={detailOpen && detail?.kind === "site"}
        onOpenChange={setDetailOpen}
        billboards={billboards}
        periodMonths={periodMonths}
        periodLabel={periodLabel}
        onEdit={(site) => setSiteForm({ site })}
        onLocate={locateSite}
        onSelectBillboard={(billboard) => openDetail({ kind: "billboard", id: billboard.billboardId })}
      />
      <ExpansionBillboardDrawer
        billboardId={detail?.kind === "billboard" ? detail.id : null}
        year={toolbar.year}
        open={detailOpen && detail?.kind === "billboard"}
        onOpenChange={setDetailOpen}
        onLocate={locateBillboard}
      />
      <ExpansionSiteFormDialog
        open={siteForm != null}
        onOpenChange={(open) => !open && setSiteForm(null)}
        site={siteForm && "site" in siteForm ? siteForm.site : null}
        point={siteForm && "point" in siteForm ? siteForm.point : null}
        billboards={billboards}
        departments={departments}
        periodMonths={periodMonths}
        onSaved={(site) => setActive({ kind: "site", id: site.id })}
      />
    </section>
  );
}
