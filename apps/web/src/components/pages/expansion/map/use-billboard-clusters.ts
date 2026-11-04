"use client";

import { useEffect, useMemo, useState } from "react";
import Supercluster from "supercluster";
import { useMap } from "@/components/primitives/ui/map";
import type { MappedBillboard } from "../expansion-analysis";

type PointProps = { id: number; score: number; occupancy: number; occupied: number };
type ClusterProps = { score: number; occupancy: number; occupied: number };

export type BillboardCluster = {
  id: number;
  longitude: number;
  latitude: number;
  count: number;
  avgScore: number;
  avgOccupancy: number;
  occupiedShare: number;
};

type View = { bbox: [number, number, number, number]; zoom: number };

const CLUSTER_MAX_ZOOM = 13;

export function useBillboardClusters(billboards: MappedBillboard[], enabled: boolean) {
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
      radius: 52,
      maxZoom: CLUSTER_MAX_ZOOM,
      map: (props) => ({
        score: props.score,
        occupancy: props.occupancy,
        occupied: props.occupied,
      }),
      reduce: (acc, props) => {
        acc.score += props.score;
        acc.occupancy += props.occupancy;
        acc.occupied += props.occupied;
      },
    });
    cluster.load(
      billboards.map((b) => ({
        type: "Feature",
        properties: {
          id: b.billboardId,
          score: b.score,
          occupancy: b.occupancyRate,
          occupied: b.occupiedNow ? 1 : 0,
        },
        geometry: { type: "Point", coordinates: [b.longitude, b.latitude] },
      })),
    );
    return cluster;
  }, [billboards]);

  const byId = useMemo(
    () => new Map(billboards.map((b) => [b.billboardId, b])),
    [billboards],
  );

  if (!enabled) return { points: billboards, clusters: [], expand: () => {} };

  const points: MappedBillboard[] = [];
  const clusters: BillboardCluster[] = [];
  if (view) {
    for (const feature of index.getClusters(view.bbox, view.zoom)) {
      const [longitude, latitude] = feature.geometry.coordinates;
      const props = feature.properties;
      if ("cluster" in props && props.cluster) {
        const count = props.point_count;
        clusters.push({
          id: props.cluster_id,
          longitude,
          latitude,
          count,
          avgScore: props.score / count,
          avgOccupancy: props.occupancy / count,
          occupiedShare: props.occupied / count,
        });
      } else {
        const billboard = byId.get((props as PointProps).id);
        if (billboard) points.push(billboard);
      }
    }
  }

  function expand(cluster: BillboardCluster) {
    map?.easeTo({
      center: [cluster.longitude, cluster.latitude],
      zoom: Math.min(index.getClusterExpansionZoom(cluster.id), CLUSTER_MAX_ZOOM + 1),
    });
  }

  return { points, clusters, expand };
}
