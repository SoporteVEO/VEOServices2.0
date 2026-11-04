"use client";

import { Eye, Footprints } from "lucide-react";
import type { ExpansionSite } from "@/api/expansion/expansion.types";
import { formatLabel } from "@/components/pages/crm/inventory/inventory-format";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { TIER_META, formatPercent, scoreTier, streetViewUrl } from "../expansion-const";

const LEVEL_LABELS = { HIGH: "Alto", MEDIUM: "Medio", LOW: "Bajo" } as const;
const DENSITY_LABELS = { HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" } as const;
import type { MappedBillboard } from "../expansion-analysis";
import type { LocationAnalysis } from "../expansion-location-score";
import { BasisHint, ScoreBar, SiteStatusBadge, TierBadge, VerdictBadge } from "../expansion-badges";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function PopupActions({
  latitude,
  longitude,
  onOpen,
}: {
  latitude: number;
  longitude: number;
  onOpen: () => void;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <Button sizeVariant="sm" icon={Eye} className="flex-1" onClick={onOpen}>
        Ver detalle
      </Button>
      <Button variant="outline" sizeVariant="sm" asChild>
        <a href={streetViewUrl(latitude, longitude)} target="_blank" rel="noreferrer">
          <Footprints className="size-4" />
          Street View
        </a>
      </Button>
    </div>
  );
}

export function BillboardPopupContent({
  billboard,
  onOpen,
}: {
  billboard: MappedBillboard;
  onOpen: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 pr-5">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{billboard.code}</span>
          <TierBadge tier={billboard.tier} score={billboard.score} />
        </div>
        <span className="text-xs text-muted-foreground">
          {formatLabel({ kind: "STATIC", ...billboard })}
          {billboard.cityName ? ` · ${billboard.cityName}` : ""}
        </span>
        {billboard.address ? <span className="line-clamp-2 text-xs">{billboard.address}</span> : null}
      </div>

      <div className="flex flex-col gap-1">
        <ScoreBar value={billboard.score} color={TIER_META[billboard.tier].color} />
        <BasisHint basis={billboard.basis} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Ocupación" value={formatPercent(billboard.occupancyRate)} />
        <Stat label="Ingresos" value={formatMoney(billboard.revenue)} />
        <Stat label="Costo mensual" value={formatMoney(billboard.monthlyCost)} />
        <Stat label="ROI" value={billboard.roi != null ? `${billboard.roi.toFixed(2)}x` : "-"} />
      </div>

      <div className="text-xs">
        <span className="text-muted-foreground">Cliente actual: </span>
        <span className="font-medium">{billboard.currentCustomer ?? "Disponible"}</span>
      </div>

      <PopupActions
        latitude={billboard.latitude}
        longitude={billboard.longitude}
        onOpen={onOpen}
      />
    </div>
  );
}

export function SitePopupContent({
  site,
  analysis,
  onOpen,
}: {
  site: ExpansionSite;
  analysis: LocationAnalysis;
  onOpen: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 pr-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{site.code}</span>
          <SiteStatusBadge status={site.status} />
        </div>
        <span className="text-sm font-medium">{site.name}</span>
        {site.address ? <span className="line-clamp-2 text-xs">{site.address}</span> : null}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-2 py-1.5">
        <span className="text-xs text-muted-foreground">
          Puntaje{" "}
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: TIER_META[scoreTier(analysis.score)].color }}
          >
            {analysis.score}
          </span>
        </span>
        <VerdictBadge verdict={analysis.verdict} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Ingreso estimado" value={formatMoney(analysis.estimatedMonthlyRevenue)} />
        <Stat label="Costo estimado" value={formatMoney(analysis.estimatedMonthlyCost)} />
        <Stat label="Ocupación zona" value={formatPercent(analysis.avgOccupancy)} />
        <Stat label="Vallas a 500 m" value={String(analysis.within500m)} />
        {analysis.context ? (
          <>
            <Stat label="Tráfico" value={LEVEL_LABELS[analysis.context.trafficLevel]} />
            <Stat label="Densidad" value={DENSITY_LABELS[analysis.context.densityLevel]} />
          </>
        ) : null}
      </div>

      <PopupActions latitude={site.latitude} longitude={site.longitude} onOpen={onOpen} />
    </div>
  );
}
