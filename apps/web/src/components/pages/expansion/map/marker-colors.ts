import type { Offset } from "maplibre-gl";
import {
  AVAILABLE_COLOR,
  OCCUPIED_COLOR,
  TIER_META,
  occupancyTier,
  scoreTier,
  type ColorMode,
} from "../expansion-const";
import type { MappedBillboard } from "../expansion-analysis";
import type { BillboardCluster } from "./use-billboard-clusters";

export const MARKER_HEIGHT = 44;

/** Markers are anchored at their tip, so popups clear the icon above the point. */
export const POPUP_OFFSET: Offset = {
  center: [0, -MARKER_HEIGHT / 2],
  top: [0, 6],
  "top-left": [0, 6],
  "top-right": [0, 6],
  bottom: [0, -MARKER_HEIGHT],
  "bottom-left": [0, -MARKER_HEIGHT],
  "bottom-right": [0, -MARKER_HEIGHT],
  left: [22, -MARKER_HEIGHT / 2],
  right: [-22, -MARKER_HEIGHT / 2],
};

export function billboardColor(billboard: MappedBillboard, mode: ColorMode): string {
  if (mode === "status") return billboard.occupiedNow ? OCCUPIED_COLOR : AVAILABLE_COLOR;
  if (mode === "occupancy") return TIER_META[occupancyTier(billboard.occupancyRate)].color;
  return TIER_META[billboard.tier].color;
}

export function clusterColor(cluster: BillboardCluster, mode: ColorMode): string {
  if (mode === "status") return cluster.occupiedShare >= 0.5 ? OCCUPIED_COLOR : AVAILABLE_COLOR;
  if (mode === "occupancy") return TIER_META[occupancyTier(cluster.avgOccupancy)].color;
  return TIER_META[scoreTier(cluster.avgScore)].color;
}
