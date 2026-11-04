import type { LngLatBoundsLike } from "maplibre-gl";
import type {
  ExpansionBillboard,
  ExpansionSite,
} from "@/api/expansion/expansion.types";

const SV_BOUNDS = { minLat: 12.5, maxLat: 15, minLng: -90.5, maxLng: -87 };
const EARTH_RADIUS_KM = 6371;

export type MappedBillboard = ExpansionBillboard & { latitude: number; longitude: number };

export function isMappedBillboard(billboard: ExpansionBillboard): billboard is MappedBillboard {
  const { latitude: lat, longitude: lng } = billboard;
  return (
    lat != null &&
    lng != null &&
    lat >= SV_BOUNDS.minLat &&
    lat <= SV_BOUNDS.maxLat &&
    lng >= SV_BOUNDS.minLng &&
    lng <= SV_BOUNDS.maxLng
  );
}

export type Point = { latitude: number; longitude: number };

export function distanceKm(a: Point, b: Point): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function pointsBounds(points: Point[]): LngLatBoundsLike | null {
  if (points.length === 0) return null;
  let [minLng, minLat, maxLng, maxLat] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const { longitude, latitude } of points) {
    minLng = Math.min(minLng, longitude);
    maxLng = Math.max(maxLng, longitude);
    minLat = Math.min(minLat, latitude);
    maxLat = Math.max(maxLat, latitude);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type Saturation = "UNDERSERVED" | "BALANCED" | "SATURATED";
export type Verdict = "RECOMMENDED" | "CAUTION" | "NOT_RECOMMENDED" | "INSUFFICIENT_DATA";

export interface ZoneSummary {
  name: string;
  count: number;
  occupiedNow: number;
  avgOccupancy: number;
  avgScore: number;
  revenue: number;
  plannedSites: number;
  share: number;
  saturation: Saturation;
  bounds: LngLatBoundsLike | null;
}

export function summarizeZones(
  billboards: MappedBillboard[],
  sites: ExpansionSite[],
): ZoneSummary[] {
  const groups = new Map<string, MappedBillboard[]>();
  for (const billboard of billboards) {
    const name = billboard.departmentName ?? "Sin departamento";
    groups.set(name, [...(groups.get(name) ?? []), billboard]);
  }
  const fairShare = groups.size > 0 ? 1 / groups.size : 0;

  return [...groups.entries()]
    .map(([name, items]) => {
      const share = billboards.length > 0 ? items.length / billboards.length : 0;
      const avgOccupancy = average(items.map((b) => b.occupancyRate)) ?? 0;
      const saturation: Saturation =
        share >= fairShare * 2 && avgOccupancy < 0.5
          ? "SATURATED"
          : share < fairShare / 2 || (avgOccupancy >= 0.75 && share < fairShare)
            ? "UNDERSERVED"
            : "BALANCED";
      return {
        name,
        count: items.length,
        occupiedNow: items.filter((b) => b.occupiedNow).length,
        avgOccupancy,
        avgScore: average(items.map((b) => b.score)) ?? 0,
        revenue: items.reduce((sum, b) => sum + b.revenue, 0),
        plannedSites: sites.filter((s) => s.departmentName === name).length,
        share,
        saturation,
        bounds: pointsBounds(items),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export const SATURATION_LABELS: Record<Saturation, string> = {
  UNDERSERVED: "Desatendida",
  BALANCED: "Equilibrada",
  SATURATED: "Saturada",
};

export const VERDICT_META: Record<
  Verdict,
  { label: string; badge: "success" | "warning" | "destructive" | "ghost" }
> = {
  RECOMMENDED: { label: "Recomendada", badge: "success" },
  CAUTION: { label: "Con reservas", badge: "warning" },
  NOT_RECOMMENDED: { label: "No recomendada", badge: "destructive" },
  INSUFFICIENT_DATA: { label: "Sin datos", badge: "ghost" },
};

export type BillboardFeatureProps = { score: number; occupancy: number; tier: string };

export function billboardsGeoJson(
  billboards: MappedBillboard[],
): GeoJSON.FeatureCollection<GeoJSON.Point, BillboardFeatureProps> {
  return {
    type: "FeatureCollection",
    features: billboards.map((b) => ({
      type: "Feature",
      properties: { score: b.score, occupancy: b.occupancyRate, tier: b.tier },
      geometry: { type: "Point", coordinates: [b.longitude, b.latitude] },
    })),
  };
}

export function nearestDepartment(point: Point, billboards: MappedBillboard[]): string | null {
  let best: { name: string; distance: number } | null = null;
  for (const billboard of billboards) {
    if (!billboard.departmentName) continue;
    const distance = distanceKm(point, billboard);
    if (!best || distance < best.distance) best = { name: billboard.departmentName, distance };
  }
  return best && best.distance <= 15 ? best.name : null;
}
