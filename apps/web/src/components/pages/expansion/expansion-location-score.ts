import type {
  ExpansionNexoInsightInput,
  LocationContext,
  RoadClass,
} from "@/api/expansion/expansion.types";
import {
  distanceKm,
  median,
  type MappedBillboard,
  type Point,
  type Saturation,
  type Verdict,
} from "./expansion-analysis";

const SATURATED_WITHIN_1KM = 5;
const CANNIBALIZATION_KM = 0.15;
const FALLBACK_NEIGHBORS = 5;

export type FactorKey = "demand" | "occupancy" | "competition" | "exposure" | "density" | "financial";

export const FACTOR_META: Record<FactorKey, { label: string; weight: number }> = {
  exposure: { label: "Exposición vehicular", weight: 25 },
  competition: { label: "Competencia propia", weight: 20 },
  demand: { label: "Rentabilidad de la zona", weight: 20 },
  occupancy: { label: "Ocupación esperada", weight: 15 },
  density: { label: "Densidad urbana", weight: 10 },
  financial: { label: "Retorno financiero", weight: 10 },
};

export const FACTOR_ORDER = Object.keys(FACTOR_META) as FactorKey[];

export const ROAD_CLASS_LABELS: Record<RoadClass, string> = {
  HIGHWAY: "carretera principal",
  PRIMARY: "vía primaria",
  SECONDARY: "vía secundaria",
  TERTIARY: "vía terciaria",
  LOCAL: "calle local",
  PATH: "paso peatonal",
  UNKNOWN: "vía sin clasificar",
};

export interface Neighbor {
  billboard: MappedBillboard;
  distanceKm: number;
}

export interface Factor {
  key: FactorKey;
  label: string;
  weight: number;
  value: number;
}

export type ReasonTone = "positive" | "negative" | "neutral";

export interface LocationAnalysis {
  radiusKm: number;
  neighbors: Neighbor[];
  usedFallback: boolean;
  nearest: Neighbor | null;
  within500m: number;
  within1Km: number;
  saturation: Saturation;
  avgOccupancy: number | null;
  avgScore: number | null;
  medianPrice: number | null;
  avgMonthlyRevenue: number | null;
  estimatedMonthlyPrice: number | null;
  estimatedMonthlyRevenue: number | null;
  estimatedMonthlyCost: number | null;
  estimatedMonthlyProfit: number | null;
  estimatedRoi: number | null;
  breakEvenOccupancy: number | null;
  context: LocationContext | null;
  factors: Factor[];
  caps: string[];
  score: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  verdict: Verdict;
  reasons: { tone: ReasonTone; text: string }[];
}

export interface LocationInput extends Point {
  estimatedMonthlyPrice?: number | null;
  estimatedMonthlyCost?: number | null;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Closer billboards say more about a location than ones at the edge of the radius. */
function weightedAverage(neighbors: Neighbor[], pick: (b: MappedBillboard) => number): number | null {
  if (neighbors.length === 0) return null;
  let total = 0;
  let weights = 0;
  for (const { billboard, distanceKm: d } of neighbors) {
    const weight = 1 / (d + 0.25);
    total += pick(billboard) * weight;
    weights += weight;
  }
  return total / weights;
}

function roadLabel(name: string | null, roadClass: RoadClass): string {
  return name ? `${name} (${ROAD_CLASS_LABELS[roadClass]})` : ROAD_CLASS_LABELS[roadClass];
}

function exposureReason(context: LocationContext): { tone: ReasonTone; text: string } {
  const { road } = context;
  const main = context.majorRoads.find((r) => r.distanceM <= 150);
  if (road && (road.roadClass === "HIGHWAY" || road.roadClass === "PRIMARY")) {
    return {
      tone: "positive",
      text: `Frente a ${roadLabel(road.name, road.roadClass)}: alta exposición vehicular.`,
    };
  }
  if (main && (main.roadClass === "HIGHWAY" || main.roadClass === "PRIMARY")) {
    return {
      tone: main.distanceM <= 60 ? "positive" : "neutral",
      text: `${roadLabel(main.name, main.roadClass)} a ${main.distanceM} m: verifica la visibilidad desde la vía.`,
    };
  }
  if (context.exposureScore < 0.3) {
    return {
      tone: "negative",
      text: `Sobre ${roadLabel(road?.name ?? null, road?.roadClass ?? "LOCAL")} sin vía principal cerca: poco tráfico y menos anunciantes interesados.`,
    };
  }
  const nearest = main ?? context.majorRoads[0];
  return {
    tone: "neutral",
    text: nearest
      ? `Vía más transitada cercana: ${roadLabel(nearest.name, nearest.roadClass)} a ${nearest.distanceM} m.`
      : `Tráfico moderado sobre ${roadLabel(road?.name ?? null, road?.roadClass ?? "UNKNOWN")}.`,
  };
}

function densityReason(context: LocationContext): { tone: ReasonTone; text: string } | null {
  const pois = context.poiCount500m;
  const place = context.locality.suburb ?? context.locality.city;
  if (context.densityLevel === "HIGH") {
    return {
      tone: "positive",
      text:
        pois != null
          ? `Zona urbana densa: ${pois} comercios, servicios y oficinas en 500 m.`
          : `Zona urbana${place ? ` (${place})` : ""} con buena densidad.`,
    };
  }
  if (context.densityLevel === "LOW") {
    return {
      tone: "negative",
      text: `Zona de baja densidad${pois != null ? ` (${pois} comercios en 500 m)` : ""}: poca audiencia y pocos anunciantes locales.`,
    };
  }
  return null;
}

/**
 * Scores a proposed location 0–100 from weighted factors. Missing factors are
 * left out (their weight is redistributed) and lower the confidence; hard caps
 * keep a strong factor from hiding a deal-breaker such as cannibalization.
 */
export function analyzeLocation(
  location: LocationInput,
  billboards: MappedBillboard[],
  months: number,
  radiusKm: number,
  context: LocationContext | null = null,
): LocationAnalysis {
  const ranked = billboards
    .map((billboard) => ({ billboard, distanceKm: distanceKm(location, billboard) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const inRadius = ranked.filter((n) => n.distanceKm <= radiusKm);
  const usedFallback = inRadius.length === 0;
  const neighbors = usedFallback ? ranked.slice(0, FALLBACK_NEIGHBORS) : inRadius;
  const nearest = ranked[0] ?? null;
  const within500m = ranked.filter((n) => n.distanceKm <= 0.5).length;
  const within1Km = ranked.filter((n) => n.distanceKm <= 1).length;
  const saturation: Saturation =
    within1Km >= SATURATED_WITHIN_1KM ? "SATURATED" : within1Km <= 1 ? "UNDERSERVED" : "BALANCED";

  const avgOccupancy = weightedAverage(neighbors, (b) => b.occupancyRate);
  const avgScore = weightedAverage(neighbors, (b) => b.score);
  const medianPrice = median(
    neighbors.map((n) => n.billboard.listPrice).filter((p): p is number => p != null && p > 0),
  );
  const avgMonthlyRevenue =
    months > 0 ? weightedAverage(neighbors, (b) => b.revenue / months) : null;

  const estimatedMonthlyPrice = location.estimatedMonthlyPrice ?? medianPrice;
  const estimatedMonthlyRevenue =
    estimatedMonthlyPrice != null && avgOccupancy != null
      ? estimatedMonthlyPrice * avgOccupancy
      : null;
  const estimatedMonthlyCost = location.estimatedMonthlyCost ?? null;
  const estimatedMonthlyProfit =
    estimatedMonthlyRevenue != null && estimatedMonthlyCost != null
      ? estimatedMonthlyRevenue - estimatedMonthlyCost
      : null;
  const estimatedRoi =
    estimatedMonthlyRevenue != null && estimatedMonthlyCost
      ? estimatedMonthlyRevenue / estimatedMonthlyCost
      : null;
  const breakEvenOccupancy =
    estimatedMonthlyCost != null && estimatedMonthlyPrice
      ? Math.min(estimatedMonthlyCost / estimatedMonthlyPrice, 1)
      : null;

  const cannibalizes = nearest != null && nearest.distanceKm < CANNIBALIZATION_KM;
  const values: Partial<Record<FactorKey, number>> = {
    competition: cannibalizes
      ? 0.1
      : clamp(1 - 0.2 * within500m - 0.06 * Math.max(0, within1Km - within500m)),
  };
  // Distant reference billboards say little about this exact spot: shrink toward neutral.
  const relevance = usedFallback && nearest ? clamp(1 - (nearest.distanceKm - radiusKm) / 10) : 1;
  const towardNeutral = (value: number) => 0.5 + (value - 0.5) * relevance;
  if (avgScore != null) values.demand = clamp(towardNeutral(avgScore / 100));
  if (avgOccupancy != null) values.occupancy = clamp(towardNeutral(avgOccupancy));
  if (context) {
    values.exposure = clamp(context.exposureScore);
    values.density = clamp(context.densityScore);
  }
  if (estimatedRoi != null) values.financial = clamp((estimatedRoi - 0.6) / 1.9);

  const factors: Factor[] = FACTOR_ORDER.filter((key) => values[key] != null).map((key) => ({
    key,
    label: FACTOR_META[key].label,
    weight: FACTOR_META[key].weight,
    value: values[key]!,
  }));
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  let score =
    totalWeight > 0
      ? (factors.reduce((sum, f) => sum + f.value * f.weight, 0) / totalWeight) * 100
      : 0;

  const caps: string[] = [];
  const cap = (limit: number, reason: string) => {
    if (score > limit) score = limit;
    caps.push(reason);
  };
  if (cannibalizes) {
    cap(40, `A ${Math.round(nearest!.distanceKm * 1000)} m de ${nearest!.billboard.code}: canibaliza su audiencia.`);
  }
  if (context && context.exposureScore < 0.3) {
    cap(55, "Calle local sin vía principal cerca.");
  }
  if (context && context.densityLevel === "LOW" && context.exposureScore < 0.65) {
    cap(60, "Baja densidad sin una vía de alto tráfico que la compense.");
  }
  if (estimatedRoi != null && estimatedRoi < 1) {
    cap(50, "El ingreso estimado no cubre el costo mensual.");
  }
  score = Math.round(score);

  const effectiveWeight = totalWeight * (0.6 + 0.4 * relevance);
  const confidence = effectiveWeight >= 90 ? "HIGH" : effectiveWeight >= 65 ? "MEDIUM" : "LOW";

  let verdict: Verdict;
  if (neighbors.length === 0) verdict = "INSUFFICIENT_DATA";
  else if (score >= 68) verdict = "RECOMMENDED";
  else if (score >= 48) verdict = "CAUTION";
  else verdict = "NOT_RECOMMENDED";

  const reasons: LocationAnalysis["reasons"] = [];
  if (context) {
    reasons.push(exposureReason(context));
    const density = densityReason(context);
    if (density) reasons.push(density);
  } else {
    reasons.push({
      tone: "neutral",
      text: "Sin datos de tráfico y densidad del entorno todavía.",
    });
  }

  if (cannibalizes) {
    reasons.push({
      tone: "negative",
      text: `Muy cerca de ${nearest!.billboard.code}: compartirían audiencia y anunciantes.`,
    });
  } else if (within500m >= 2) {
    reasons.push({
      tone: "negative",
      text: `${within500m} vallas propias a menos de 500 m compiten por la misma audiencia.`,
    });
  } else if (saturation === "SATURATED") {
    reasons.push({ tone: "negative", text: `Zona saturada: ${within1Km} vallas propias a menos de 1 km.` });
  } else if (saturation === "UNDERSERVED") {
    reasons.push({ tone: "positive", text: "Sin presencia propia cercana: aporta cobertura nueva." });
  }

  if (avgOccupancy != null && avgOccupancy >= 0.75) {
    reasons.push({
      tone: "positive",
      text: `Las vallas vecinas están ocupadas ${Math.round(avgOccupancy * 100)}% del tiempo: demanda comprobada.`,
    });
  } else if (avgOccupancy != null && avgOccupancy < 0.4) {
    reasons.push({
      tone: "negative",
      text: `Las vallas vecinas solo se ocupan ${Math.round(avgOccupancy * 100)}% del tiempo.`,
    });
  }

  if (avgScore != null && avgScore >= 60) {
    reasons.push({ tone: "positive", text: "Las vallas de la zona tienen buena rentabilidad." });
  } else if (avgScore != null && avgScore < 40) {
    reasons.push({ tone: "negative", text: "Las vallas de la zona rinden por debajo del promedio." });
  }

  if (estimatedRoi != null) {
    reasons.push(
      estimatedRoi >= 2
        ? { tone: "positive", text: "El ingreso estimado duplica el costo mensual." }
        : estimatedRoi >= 1.2
          ? { tone: "neutral", text: "El ingreso estimado cubre el costo con margen ajustado." }
          : { tone: "negative", text: "El ingreso estimado no cubre el costo mensual con holgura." },
    );
  } else {
    reasons.push({ tone: "neutral", text: "Ingresa un costo mensual estimado para calcular el retorno." });
  }

  return {
    radiusKm,
    neighbors,
    usedFallback,
    nearest,
    within500m,
    within1Km,
    saturation,
    avgOccupancy,
    avgScore,
    medianPrice,
    avgMonthlyRevenue,
    estimatedMonthlyPrice,
    estimatedMonthlyRevenue,
    estimatedMonthlyCost,
    estimatedMonthlyProfit,
    estimatedRoi,
    breakEvenOccupancy,
    context,
    factors,
    caps,
    score,
    confidence,
    verdict,
    reasons,
  };
}

export function toNexoAnalysis(analysis: LocationAnalysis): ExpansionNexoInsightInput["analysis"] {
  const round = (value: number | null, digits = 4) =>
    value == null ? null : Number(value.toFixed(digits));
  return {
    score: analysis.score,
    verdict: analysis.verdict,
    confidence: analysis.confidence,
    factors: analysis.factors.map(({ key, value, weight }) => ({
      key,
      value: Number(value.toFixed(3)),
      weight,
    })),
    caps: analysis.caps,
    within500m: analysis.within500m,
    within1Km: analysis.within1Km,
    saturation: analysis.saturation,
    nearestDistanceM: analysis.nearest ? Math.round(analysis.nearest.distanceKm * 1000) : null,
    nearestCode: analysis.nearest?.billboard.code ?? null,
    avgOccupancy: round(analysis.avgOccupancy),
    avgScore: round(analysis.avgScore, 1),
    medianPrice: round(analysis.medianPrice, 2),
    estimatedMonthlyRevenue: round(analysis.estimatedMonthlyRevenue, 2),
    estimatedRoi: analysis.estimatedRoi == null ? null : Math.min(round(analysis.estimatedRoi, 3)!, 1000),
    breakEvenOccupancy: round(analysis.breakEvenOccupancy),
  };
}
