"use client";

import { useState } from "react";
import { CircleCheck, CircleMinus, CircleX, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRefreshSiteContext } from "@/api/expansion/expansion.mutations";
import type { ExpansionSite } from "@/api/expansion/expansion.types";
import { ToggleGroup, ToggleGroupItem } from "@/components/primitives/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ANALYSIS_RADIUS_OPTIONS,
  TIER_META,
  formatDistance,
  formatPercent,
  scoreTier,
} from "../expansion-const";
import { SATURATION_LABELS, type MappedBillboard } from "../expansion-analysis";
import { ScoreBar, TierBadge } from "../expansion-badges";
import { analyzeLocation, toNexoAnalysis } from "../expansion-location-score";
import { ExpansionNexoInsight } from "./expansion-nexo-insight";
import { ExpansionScoreBreakdown } from "./expansion-score-breakdown";

const REASON_ICONS = {
  positive: { icon: CircleCheck, className: "text-success" },
  negative: { icon: CircleX, className: "text-destructive" },
  neutral: { icon: CircleMinus, className: "text-muted-foreground" },
};

const NEIGHBORS_SHOWN = 8;

export function ExpansionSiteAnalysis({
  site,
  billboards,
  periodMonths,
  periodLabel,
  onSelectBillboard,
}: {
  site: ExpansionSite;
  billboards: MappedBillboard[];
  periodMonths: number;
  periodLabel: string;
  onSelectBillboard: (billboard: MappedBillboard) => void;
}) {
  const [radiusKm, setRadiusKm] = useState(2);
  const refreshContext = useRefreshSiteContext();
  const analysis = analyzeLocation(site, billboards, periodMonths, radiusKm, site.locationContext);
  const scoreColor = TIER_META[scoreTier(analysis.avgScore ?? 0)].color;

  async function handleRefreshContext() {
    try {
      await refreshContext.mutateAsync(site.id);
      toast.success("Entorno actualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo consultar el entorno.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Vallas propias · {periodLabel} · entorno OpenStreetMap
          </span>
          <Button
            variant="ghost"
            sizeVariant="sm"
            icon={RefreshCw}
            loading={refreshContext.isPending}
            onClick={handleRefreshContext}
          >
            {site.locationContext ? "Actualizar entorno" : "Analizar entorno"}
          </Button>
        </div>
        <ExpansionScoreBreakdown analysis={analysis} contextLoading={refreshContext.isPending} />
        <ul className="flex flex-col gap-1.5">
          {analysis.reasons.map((reason) => {
            const { icon: Icon, className } = REASON_ICONS[reason.tone];
            return (
              <li key={reason.text} className="flex items-start gap-2 text-sm">
                <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
                {reason.text}
              </li>
            );
          })}
        </ul>
      </div>

      <ExpansionNexoInsight
        key={`${site.id}-${radiusKm}`}
        waiting={refreshContext.isPending}
        request={{
          latitude: site.latitude,
          longitude: site.longitude,
          siteId: site.id,
          name: site.name,
          formatCode: site.formatCode,
          width: site.width,
          height: site.height,
          estimatedMonthlyPrice: site.estimatedMonthlyPrice,
          estimatedMonthlyCost: site.estimatedMonthlyCost,
          analysis: toNexoAnalysis(analysis),
        }}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Radio de comparación</h4>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            spacing={0}
            value={String(radiusKm)}
            onValueChange={(value) => value && setRadiusKm(Number(value))}
          >
            {ANALYSIS_RADIUS_OPTIONS.map((km) => (
              <ToggleGroupItem key={km} value={String(km)}>
                {km} km
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {analysis.usedFallback ? (
          <p className="text-xs text-muted-foreground">
            No hay vallas en {radiusKm} km; se usan las {analysis.neighbors.length} más cercanas.
          </p>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Rentabilidad de la zona">
          <div className="flex items-center gap-2">
            <span className="tabular-nums" style={{ color: scoreColor }}>
              {analysis.avgScore != null ? Math.round(analysis.avgScore) : "-"}
            </span>
            <ScoreBar value={analysis.avgScore ?? 0} color={scoreColor} />
          </div>
        </Metric>
        <Metric label="Ocupación esperada">{formatPercent(analysis.avgOccupancy)}</Metric>
        <Metric label="Saturación">
          {SATURATION_LABELS[analysis.saturation]}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            · {analysis.within1Km} a 1 km
          </span>
        </Metric>
        <Metric label="Precio de la zona">{formatMoney(analysis.medianPrice)}</Metric>
        <Metric label="Ingreso promedio vecinas">
          {analysis.avgMonthlyRevenue != null ? `${formatMoney(analysis.avgMonthlyRevenue)}/mes` : "-"}
        </Metric>
        <Metric label="Valla más cercana">
          {analysis.nearest ? formatDistance(analysis.nearest.distanceKm) : "-"}
        </Metric>
      </dl>

      <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4">
        <h4 className="text-sm font-semibold">Proyección mensual</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Precio">{formatMoney(analysis.estimatedMonthlyPrice)}</Metric>
          <Metric label="Ingreso estimado">{formatMoney(analysis.estimatedMonthlyRevenue)}</Metric>
          <Metric label="Costo estimado">{formatMoney(analysis.estimatedMonthlyCost)}</Metric>
          <Metric label="Utilidad">
            <span
              className={cn(
                analysis.estimatedMonthlyProfit != null &&
                  (analysis.estimatedMonthlyProfit >= 0 ? "text-success" : "text-destructive"),
              )}
            >
              {formatMoney(analysis.estimatedMonthlyProfit)}
            </span>
          </Metric>
        </div>
        <p className="text-xs text-muted-foreground">
          {analysis.estimatedRoi != null
            ? `Retorno estimado ${analysis.estimatedRoi.toFixed(2)}x. `
            : ""}
          {analysis.breakEvenOccupancy != null
            ? `Necesita ${formatPercent(analysis.breakEvenOccupancy)} de ocupación para cubrir su costo.`
            : "Agrega precio y costo estimados en Detalle para proyectar el retorno."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold">Vallas de referencia</h4>
        <ul className="flex flex-col divide-y rounded-lg border">
          {analysis.neighbors.slice(0, NEIGHBORS_SHOWN).map(({ billboard, distanceKm }) => (
            <li key={billboard.billboardId}>
              <button
                type="button"
                onClick={() => onSelectBillboard(billboard)}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-muted/50"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{billboard.code}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatDistance(distanceKm)} · {formatPercent(billboard.occupancyRate)} ocupación ·{" "}
                    {formatMoney(billboard.listPrice)}
                  </span>
                </span>
                <TierBadge tier={billboard.tier} score={billboard.score} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  );
}
