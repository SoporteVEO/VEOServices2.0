"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import type { MapMouseEvent } from "maplibre-gl";
import { useMap } from "@/components/primitives/ui/map";
import { pointsBounds, type MappedBillboard } from "../expansion-analysis";

export const FIT_OPTIONS = { padding: 64, maxZoom: 14, duration: 700 };

/** Frames the billboards once; base-style swaps reload the map and must keep the camera. */
export function FitOnce({ billboards }: { billboards: MappedBillboard[] }) {
  const { map, isLoaded } = useMap();
  const fittedRef = useRef(false);
  const bounds = billboards.length > 0 ? JSON.stringify(pointsBounds(billboards)) : null;

  useEffect(() => {
    if (!map || !isLoaded || !bounds || fittedRef.current) return;
    fittedRef.current = true;
    map.fitBounds(JSON.parse(bounds), { ...FIT_OPTIONS, duration: 0 });
  }, [map, isLoaded, bounds]);

  return null;
}

type LngLat = { latitude: number; longitude: number };

/** Left click places a site while in placement mode; right click places one anytime. */
export function PlacementEvents({
  placing,
  onPick,
}: {
  placing: boolean;
  onPick: (point: LngLat) => void;
}) {
  const { map } = useMap();
  const pickPoint = useEffectEvent((event: MapMouseEvent) =>
    onPick({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }),
  );

  useEffect(() => {
    if (!map) return;
    const pick = (event: MapMouseEvent) => pickPoint(event);
    const canvas = map.getCanvas();
    map.on("contextmenu", pick);
    if (placing) {
      map.on("click", pick);
      canvas.style.cursor = "crosshair";
    }
    return () => {
      map.off("contextmenu", pick);
      map.off("click", pick);
      canvas.style.cursor = "";
    };
  }, [map, placing]);

  return null;
}
