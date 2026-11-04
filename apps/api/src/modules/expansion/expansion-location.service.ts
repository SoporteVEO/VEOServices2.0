import { Injectable, Logger } from '@nestjs/common';
import { TtlCache } from '../../lib/ttl-cache.js';
import {
  distanceToPolyline,
  finalizeContext,
  roadClassOf,
  settlementOf,
  type LocationContext,
  type NearbyRoad,
} from './expansion-location-context.js';

const USER_AGENT = 'VEO-Services/1.0 (expansion site planning)';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_MIN_INTERVAL_MS = 1100;
const NOMINATIM_TIMEOUT_MS = 6000;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const OVERPASS_TIMEOUT_MS = 8000;
const CONTEXT_TTL_MS = 24 * 60 * 60 * 1000;
const MAJOR_ROAD_RADIUS_M = 400;
const MAX_MAJOR_ROADS = 5;

type NominatimReverse = {
  category?: string;
  type?: string;
  name?: string;
  address?: Record<string, string | undefined>;
};

type OverpassElement = {
  type: string;
  tags?: Record<string, string>;
  geometry?: ({ lat: number; lon: number } | null)[];
};

type OverpassResult = {
  majorRoads: NearbyRoad[];
  poiCount: number;
  buildingCount: number;
  landuse: string[];
};

function overpassQuery(lat: number, lon: number): string {
  const d = 0.005;
  const bbox = [lat - d, lon - d, lat + d, lon + d].join(',');
  return `[out:json][timeout:8];
way(around:${MAJOR_ROAD_RADIUS_M},${lat},${lon})[highway~"^(motorway|trunk|primary|secondary|tertiary)(_link)?$"];
out tags geom(${bbox});
nwr(around:500,${lat},${lon})[~"^(amenity|shop|office)$"~"."];
out count;
way(around:300,${lat},${lon})[building];
out count;
is_in(${lat},${lon})->.a;
area.a[landuse];
out tags;`;
}

/**
 * Reads a planned site's surroundings from OpenStreetMap. Nominatim (road in
 * front, settlement) is the baseline; Overpass (main roads nearby, shops,
 * buildings) is best-effort because the public instances are often saturated.
 */
@Injectable()
export class ExpansionLocationService {
  private readonly logger = new Logger(ExpansionLocationService.name);
  private readonly cache = new TtlCache<LocationContext>(CONTEXT_TTL_MS);
  private nominatimQueue: Promise<unknown> = Promise.resolve();
  private lastNominatimAt = 0;
  private overpassCursor = 0;

  getContext(
    latitude: number,
    longitude: number,
    fresh = false,
  ): Promise<LocationContext> {
    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (fresh) this.cache.invalidate(key);
    return this.cache.getOrFetch(key, () =>
      this.fetchContext(latitude, longitude),
    );
  }

  /** Never throws: a site without surroundings is still a valid site. */
  async tryGetContext(
    latitude: number,
    longitude: number,
    fresh = false,
  ): Promise<LocationContext | null> {
    try {
      return await this.getContext(latitude, longitude, fresh);
    } catch (error) {
      this.logger.warn(`[expansion:location] ${String(error)}`);
      return null;
    }
  }

  private async fetchContext(
    lat: number,
    lon: number,
  ): Promise<LocationContext> {
    const [nominatim, overpass] = await Promise.all([
      this.reverse(lat, lon).catch((error: unknown) => {
        this.logger.warn(`[expansion:nominatim] ${String(error)}`);
        return null;
      }),
      this.overpass(lat, lon).catch((error: unknown) => {
        this.logger.warn(`[expansion:overpass] ${String(error)}`);
        return null;
      }),
    ]);
    if (!nominatim && !overpass) {
      throw new Error('OpenStreetMap no respondió');
    }

    const address = nominatim?.address ?? {};
    const road =
      nominatim?.category === 'highway'
        ? {
            name: nominatim.name || address.road || null,
            roadClass: roadClassOf(nominatim.type),
          }
        : address.road
          ? { name: address.road, roadClass: 'UNKNOWN' as const }
          : null;

    return finalizeContext({
      version: 1,
      fetchedAt: new Date().toISOString(),
      sources: { nominatim: !!nominatim, overpass: !!overpass },
      road,
      majorRoads: overpass?.majorRoads ?? [],
      locality: {
        neighbourhood: address.neighbourhood ?? null,
        suburb: address.suburb ?? null,
        city: address.city ?? address.town ?? address.village ?? null,
        municipality: address.municipality ?? null,
        department: address.state ?? null,
      },
      settlement: settlementOf(address),
      poiCount500m: overpass?.poiCount ?? null,
      buildingCount300m: overpass?.buildingCount ?? null,
      landuse: overpass?.landuse ?? [],
    });
  }

  /** Nominatim's usage policy allows one request per second per client. */
  private reverse(lat: number, lon: number): Promise<NominatimReverse> {
    const run = async () => {
      const wait =
        this.lastNominatimAt + NOMINATIM_MIN_INTERVAL_MS - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      this.lastNominatimAt = Date.now();
      const url = new URL(NOMINATIM_URL);
      url.search = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        zoom: '17',
        format: 'jsonv2',
        addressdetails: '1',
        'accept-language': 'es',
      }).toString();
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(NOMINATIM_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`Nominatim ${response.status}`);
      return (await response.json()) as NominatimReverse;
    };
    const result = this.nominatimQueue.then(run, run);
    this.nominatimQueue = result.catch(() => undefined);
    return result;
  }

  private async overpass(lat: number, lon: number): Promise<OverpassResult> {
    const endpoint =
      OVERPASS_ENDPOINTS[this.overpassCursor++ % OVERPASS_ENDPOINTS.length];
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ data: overpassQuery(lat, lon) }).toString(),
      signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    const { elements = [] } = (await response.json()) as {
      elements?: OverpassElement[];
    };

    const counts = elements.filter((e) => e.type === 'count');
    const byName = new Map<string, NearbyRoad>();
    for (const way of elements) {
      if (way.type !== 'way' || !way.geometry) continue;
      const road: NearbyRoad = {
        name: way.tags?.name ?? way.tags?.ref ?? null,
        roadClass: roadClassOf(way.tags?.highway),
        distanceM: Math.round(distanceToPolyline({ lat, lon }, way.geometry)),
      };
      if (!Number.isFinite(road.distanceM)) continue;
      const key = road.name ?? `${road.roadClass}-${road.distanceM}`;
      const existing = byName.get(key);
      if (!existing || road.distanceM < existing.distanceM)
        byName.set(key, road);
    }

    return {
      majorRoads: [...byName.values()]
        .sort((a, b) => a.distanceM - b.distanceM)
        .slice(0, MAX_MAJOR_ROADS),
      poiCount: Number(counts[0]?.tags?.total ?? 0),
      buildingCount: Number(counts[1]?.tags?.total ?? 0),
      landuse: [
        ...new Set(
          elements
            .filter((e) => e.type === 'area' && e.tags?.landuse)
            .map((e) => e.tags!.landuse),
        ),
      ],
    };
  }
}
