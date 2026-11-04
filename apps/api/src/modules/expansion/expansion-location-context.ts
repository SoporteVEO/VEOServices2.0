export type RoadClass =
  | 'HIGHWAY'
  | 'PRIMARY'
  | 'SECONDARY'
  | 'TERTIARY'
  | 'LOCAL'
  | 'PATH'
  | 'UNKNOWN';

export type SettlementType = 'CITY' | 'TOWN' | 'VILLAGE' | 'RURAL' | 'UNKNOWN';
export type Level = 'HIGH' | 'MEDIUM' | 'LOW';

export interface NearbyRoad {
  name: string | null;
  roadClass: RoadClass;
  distanceM: number;
}

export interface LocationContext {
  version: 1;
  fetchedAt: string;
  sources: { nominatim: boolean; overpass: boolean };
  road: { name: string | null; roadClass: RoadClass } | null;
  majorRoads: NearbyRoad[];
  locality: {
    neighbourhood: string | null;
    suburb: string | null;
    city: string | null;
    municipality: string | null;
    department: string | null;
  };
  settlement: SettlementType;
  poiCount500m: number | null;
  buildingCount300m: number | null;
  landuse: string[];
  exposureScore: number;
  densityScore: number;
  trafficLevel: Level;
  densityLevel: Level;
}

const CLASS_WEIGHT: Record<RoadClass, number> = {
  HIGHWAY: 1,
  PRIMARY: 0.9,
  SECONDARY: 0.7,
  TERTIARY: 0.5,
  LOCAL: 0.2,
  PATH: 0.1,
  UNKNOWN: 0.3,
};

const SETTLEMENT_SCORE: Record<SettlementType, number> = {
  CITY: 0.8,
  TOWN: 0.55,
  VILLAGE: 0.3,
  RURAL: 0.1,
  UNKNOWN: 0.4,
};

export function roadClassOf(highway: string | null | undefined): RoadClass {
  const base = (highway ?? '').replace(/_link$/, '');
  switch (base) {
    case 'motorway':
    case 'trunk':
      return 'HIGHWAY';
    case 'primary':
      return 'PRIMARY';
    case 'secondary':
      return 'SECONDARY';
    case 'tertiary':
      return 'TERTIARY';
    case 'residential':
    case 'unclassified':
    case 'living_street':
    case 'service':
    case 'road':
      return 'LOCAL';
    case 'footway':
    case 'path':
    case 'pedestrian':
    case 'track':
    case 'cycleway':
    case 'steps':
      return 'PATH';
    default:
      return 'UNKNOWN';
  }
}

/** Visibility falls off quickly: a road 150 m away is half as valuable as one in front. */
function distanceDecay(meters: number): number {
  if (meters <= 40) return 1;
  if (meters <= 150) return 1 - ((meters - 40) / 110) * 0.5;
  if (meters <= 400) return 0.5 - ((meters - 150) / 250) * 0.4;
  return 0.1;
}

function levelOf(score: number): Level {
  if (score >= 0.65) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

function logScale(value: number, saturation: number): number {
  return Math.min(1, Math.log1p(value) / Math.log1p(saturation));
}

export function exposureScore(
  road: LocationContext['road'],
  majorRoads: NearbyRoad[],
): number {
  const fronting = road ? CLASS_WEIGHT[road.roadClass] : 0;
  const nearby = majorRoads.map(
    (r) => CLASS_WEIGHT[r.roadClass] * distanceDecay(r.distanceM),
  );
  return Math.max(fronting, ...nearby, 0.05);
}

export function densityScore(
  settlement: SettlementType,
  poiCount: number | null,
  buildingCount: number | null,
): number {
  const settlementScore = SETTLEMENT_SCORE[settlement];
  if (poiCount == null || buildingCount == null) return settlementScore;
  const osm =
    0.6 * logScale(poiCount, 120) + 0.4 * logScale(buildingCount, 300);
  return 0.7 * osm + 0.3 * settlementScore;
}

export function settlementOf(
  address: Record<string, string | undefined>,
): SettlementType {
  if (address.city) return 'CITY';
  if (address.town) return 'TOWN';
  if (address.village) return 'VILLAGE';
  if (address.hamlet || address.isolated_dwelling || address.farm)
    return 'RURAL';
  return 'UNKNOWN';
}

export function finalizeContext(
  partial: Omit<
    LocationContext,
    'exposureScore' | 'densityScore' | 'trafficLevel' | 'densityLevel'
  >,
): LocationContext {
  const exposure = exposureScore(partial.road, partial.majorRoads);
  const density = densityScore(
    partial.settlement,
    partial.poiCount500m,
    partial.buildingCount300m,
  );
  return {
    ...partial,
    exposureScore: Number(exposure.toFixed(3)),
    densityScore: Number(density.toFixed(3)),
    trafficLevel: levelOf(exposure),
    densityLevel: levelOf(density),
  };
}

type LatLon = { lat: number; lon: number };

/** Meters from a point to a polyline, on a local equirectangular projection. */
export function distanceToPolyline(
  point: LatLon,
  line: (LatLon | null)[],
): number {
  const kx = 111_320 * Math.cos((point.lat * Math.PI) / 180);
  const ky = 110_540;
  const project = (p: LatLon) => ({
    x: (p.lon - point.lon) * kx,
    y: (p.lat - point.lat) * ky,
  });
  const pts = line.filter((p): p is LatLon => p != null).map(project);
  if (pts.length === 0) return Infinity;
  if (pts.length === 1) return Math.hypot(pts[0].x, pts[0].y);

  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    const t =
      lengthSq === 0
        ? 0
        : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / lengthSq));
    best = Math.min(best, Math.hypot(a.x + t * dx, a.y + t * dy));
  }
  return best;
}
