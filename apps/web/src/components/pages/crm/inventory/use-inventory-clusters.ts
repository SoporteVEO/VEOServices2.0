"use client";

import { useEffect, useMemo, useState } from "react";
import Supercluster from "supercluster";
import { useMap } from "@/components/primitives/ui/map";
import type { MappableItem } from "./inventory-format";

type PointProps = { key: string; available: number };
type ClusterProps = { available: number };

export type InventoryCluster = {
  id: number;
  longitude: number;
  latitude: number;
  count: number;
  available: number;
};

type View = { bbox: [number, number, number, number]; zoom: number };

export const CLUSTER_MAX_ZOOM = 13;

export function useInventoryClusters(items: MappableItem[]) {
  const { map } = useMap();
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    if (!map) return;
    const update = () => {
      const bounds = map.getBounds();
      setView({
        bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom: Math.floor(map.getZoom()),
      });
    };
    update();
    map.on("moveend", update);
    return () => {
      map.off("moveend", update);
    };
  }, [map]);

  const index = useMemo(() => {
    const cluster = new Supercluster<PointProps, ClusterProps>({
      radius: 48,
      maxZoom: CLUSTER_MAX_ZOOM,
      map: (props) => ({ available: props.available }),
      reduce: (acc, props) => {
        acc.available += props.available;
      },
    });
    cluster.load(
      items.map((item) => ({
        type: "Feature",
        properties: { key: item.key, available: item.state === "AVAILABLE" ? 1 : 0 },
        geometry: { type: "Point", coordinates: [item.longitude, item.latitude] },
      })),
    );
    return cluster;
  }, [items]);

  const byKey = useMemo(() => new Map(items.map((item) => [item.key, item])), [items]);

  const points: MappableItem[] = [];
  const clusters: InventoryCluster[] = [];
  if (view) {
    for (const feature of index.getClusters(view.bbox, view.zoom)) {
      const [longitude, latitude] = feature.geometry.coordinates;
      const props = feature.properties;
      if ("cluster" in props && props.cluster) {
        clusters.push({
          id: props.cluster_id,
          longitude,
          latitude,
          count: props.point_count,
          available: props.available,
        });
      } else {
        const item = byKey.get((props as PointProps).key);
        if (item) points.push(item);
      }
    }
  }

  function expand(cluster: InventoryCluster) {
    map?.easeTo({
      center: [cluster.longitude, cluster.latitude],
      zoom: Math.min(index.getClusterExpansionZoom(cluster.id), CLUSTER_MAX_ZOOM + 1),
    });
  }

  return { points, clusters, expand };
}
