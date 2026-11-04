"use client";

import { Building2, Car, MapPin, OctagonAlert } from "lucide-react";
import type { ContextLevel, LocationContext } from "@/api/expansion/expansion.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import { TIER_META, scoreTier } from "../expansion-const";
import { ScoreBar, VerdictBadge } from "../expansion-badges";
import { ROAD_CLASS_LABELS, type LocationAnalysis } from "../expansion-location-score";

const TRAFFIC_LABELS: Record<ContextLevel, string> = { HIGH: "alto", MEDIUM: "medio", LOW: "bajo" };
const DENSITY_LABELS: Record<ContextLevel, string> = { HIGH: "alta", MEDIUM: "media", LOW: "baja" };
const LEVEL_BADGE: Record<ContextLevel, "success" | "warning" | "destructive"> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "destructive",
};
const CONFIDENCE_LABELS = { HIGH: "Confianza alta", MEDIUM: "Confianza media", LOW: "Confianza baja" };

export function ExpansionScoreBreakdown({
  analysis,
  contextLoading = false,
  compact = false,
}: {
  analysis: LocationAnalysis;
  contextLoading?: boolean;
  compact?: boolean;
}) {
  const color = TIER_META[scoreTier(analysis.score)].color;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-semibold tabular-nums" style={{ color }}>
          {analysis.score}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Puntaje de ubicación · {CONFIDENCE_LABELS[analysis.confidence]}
            </span>
            <VerdictBadge verdict={analysis.verdict} />
          </div>
          <ScoreBar value={analysis.score} color={color} />
        </div>
      </div>

      <SurroundingsChips context={analysis.context} loading={contextLoading} />

      {compact ? null : (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {analysis.factors.map((factor) => {
            const factorColor = TIER_META[scoreTier(factor.value * 100)].color;
            return (
              <li key={factor.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {factor.label} <span className="text-[10px]">· {factor.weight}%</span>
                  </span>
                  <span className="font-medium tabular-nums">{Math.round(factor.value * 100)}</span>
                </div>
                <ScoreBar value={factor.value * 100} color={factorColor} />
              </li>
            );
          })}
        </ul>
      )}

      {analysis.caps.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {analysis.caps.map((cap) => (
            <li key={cap} className="flex items-start gap-1.5 text-xs text-destructive">
              <OctagonAlert className="mt-px size-3.5 shrink-0" />
              {cap}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SurroundingsChips({
  context,
  loading,
}: {
  context: LocationContext | null;
  loading: boolean;
}) {
  if (!context) {
    return (
      <p className="text-xs text-muted-foreground">
        {loading
          ? "Consultando calles y densidad en OpenStreetMap..."
          : "Sin datos del entorno: el puntaje usa solo el inventario VEO."}
      </p>
    );
  }

  const place = [context.locality.suburb, context.locality.city].filter(Boolean).join(", ");
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <Badge variant={LEVEL_BADGE[context.trafficLevel]}>
        <Car /> Tráfico {TRAFFIC_LABELS[context.trafficLevel]}
      </Badge>
      <Badge variant={LEVEL_BADGE[context.densityLevel]}>
        <Building2 /> Densidad {DENSITY_LABELS[context.densityLevel]}
      </Badge>
      {context.road ? (
        <span className={cn("truncate text-muted-foreground")}>
          {context.road.name ?? "Sin nombre"} · {ROAD_CLASS_LABELS[context.road.roadClass]}
        </span>
      ) : null}
      {place ? (
        <span className="flex items-center gap-0.5 text-muted-foreground">
          <MapPin className="size-3" />
          {place}
        </span>
      ) : null}
    </div>
  );
}
