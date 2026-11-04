"use client";

import { useEffect, useEffectEvent, useMemo } from "react";
import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  GeoJSONSource,
  HeatmapLayerSpecification,
} from "maplibre-gl";
import { useMap } from "@/components/primitives/ui/map";
import { TIER_META } from "../expansion-const";
import { billboardsGeoJson, type MappedBillboard } from "../expansion-analysis";

type LayerSpec =
  | Omit<HeatmapLayerSpecification, "source">
  | Omit<CircleLayerSpecification, "source">;

/** Owns one GeoJSON source and its layers; both are re-added after every base-style swap. */
function GeoJsonLayers({
  id,
  data,
  layers,
}: {
  id: string;
  data: GeoJSON.FeatureCollection;
  layers: LayerSpec[];
}) {
  const { map, isLoaded } = useMap();
  const sourceId = `${id}-source`;
  const currentData = useEffectEvent(() => data);

  useEffect(() => {
    if (!isLoaded || !map) return;
    map.addSource(sourceId, { type: "geojson", data: currentData() });
    for (const layer of layers) map.addLayer({ ...layer, source: sourceId } as never);
    return () => {
      try {
        for (const layer of layers) if (map.getLayer(layer.id)) map.removeLayer(layer.id);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // style may be mid-reload
      }
    };
  }, [isLoaded, map, sourceId, layers]);

  useEffect(() => {
    if (!isLoaded || !map) return;
    (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData(data);
  }, [isLoaded, map, sourceId, data]);

  return null;
}

const HEAT_INTENSITY: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  7,
  0.8,
  15,
  2.5,
];

const HEAT_RADIUS: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  7,
  14,
  12,
  32,
  16,
  60,
];

const PROFIT_HEAT: LayerSpec = {
  id: "expansion-profit-heat",
  type: "heatmap",
  maxzoom: 17,
  paint: {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "score"], 0, 0, 100, 1],
    "heatmap-intensity": HEAT_INTENSITY,
    "heatmap-radius": HEAT_RADIUS,
    "heatmap-opacity": 0.75,
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(0,0,0,0)",
      0.15,
      "rgba(254,240,138,0.55)",
      0.4,
      "#facc15",
      0.65,
      "#84cc16",
      0.85,
      "#16a34a",
      1,
      "#14532d",
    ],
  },
};

const DENSITY_HEAT: LayerSpec = {
  id: "expansion-density-heat",
  type: "heatmap",
  maxzoom: 17,
  paint: {
    "heatmap-weight": 1,
    "heatmap-intensity": HEAT_INTENSITY,
    "heatmap-radius": HEAT_RADIUS,
    "heatmap-opacity": 0.7,
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(0,0,0,0)",
      0.15,
      "rgba(191,219,254,0.5)",
      0.4,
      "#60a5fa",
      0.65,
      "#a855f7",
      0.85,
      "#ec4899",
      1,
      "#be123c",
    ],
  },
};

export function HeatmapLayers({
  billboards,
  profit,
  density,
}: {
  billboards: MappedBillboard[];
  profit: boolean;
  density: boolean;
}) {
  const data = useMemo(() => billboardsGeoJson(billboards), [billboards]);
  const layers = useMemo(
    () => [...(density ? [DENSITY_HEAT] : []), ...(profit ? [PROFIT_HEAT] : [])],
    [profit, density],
  );
  if (layers.length === 0) return null;
  return <GeoJsonLayers id="expansion-heat" data={data} layers={layers} />;
}

/** Circle radius in pixels for a fixed ground distance (Web Mercator, 512px tiles). */
function metersToPixels(meters: number, latitude: number): ExpressionSpecification {
  const metersPerPixelAtZ0 = 78271.517 * Math.cos((latitude * Math.PI) / 180);
  return [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    0,
    meters / metersPerPixelAtZ0,
    22,
    (meters / metersPerPixelAtZ0) * 2 ** 22,
  ];
}

const TIER_COLOR_MATCH: ExpressionSpecification = [
  "match",
  ["get", "tier"],
  "HIGH",
  TIER_META.HIGH.color,
  "MEDIUM",
  TIER_META.MEDIUM.color,
  "LOW",
  TIER_META.LOW.color,
  TIER_META.CRITICAL.color,
];

export function CoverageLayer({
  billboards,
  radiusMeters,
}: {
  billboards: MappedBillboard[];
  radiusMeters: number;
}) {
  const data = useMemo(() => billboardsGeoJson(billboards), [billboards]);
  const layers = useMemo<LayerSpec[]>(
    () => [
      {
        id: "expansion-coverage",
        type: "circle",
        paint: {
          "circle-radius": metersToPixels(radiusMeters, 13.7),
          "circle-color": TIER_COLOR_MATCH,
          "circle-opacity": 0.12,
          "circle-stroke-color": TIER_COLOR_MATCH,
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.45,
        },
      },
    ],
    [radiusMeters],
  );
  return <GeoJsonLayers id="expansion-coverage" data={data} layers={layers} />;
}
