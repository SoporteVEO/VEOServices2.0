import type { LngLatBoundsLike } from "maplibre-gl";
import type { InventoryItem } from "@/api/crm/crm-ooh.types";

/** Brilo face type code (`TiposCaras.ticaCodigo`) → brand OOH icon. */
const FORMAT_ICONS: Record<string, string> = {
  VS: "13-twin-leg",
  VE: "30-t-board",
  MV: "14-square-board",
  TR: "19-totem",
  PT: "11-bridge-board",
  PS: "24-overpass",
  PLT: "07-pole-banner",
  VD: "23-monitor",
};

const FORMAT_LABELS: Record<string, string> = {
  VS: "Valla estándar",
  VE: "Valla espectacular",
  MV: "Mini valla",
  TR: "Torre",
  PT: "Portal",
  PS: "Pasarela",
  PLT: "Paleta",
  VD: "Valla digital",
};

const DEFAULT_STATIC_ICON = "12-unipole";
const DIGITAL_ICON = "23-monitor";

/** Coordinates outside the country are data-entry errors (e.g. flipped signs). */
const SV_BOUNDS = { minLat: 12.5, maxLat: 15, minLng: -90.5, maxLng: -87 };

export const SV_CENTER: [number, number] = [-88.9, 13.75];

type FormatRef = Pick<InventoryItem, "kind" | "formatCode" | "structureName">;

export type MappableItem = InventoryItem & { latitude: number; longitude: number };

export function formatIconSrc(item: FormatRef): string {
  const name =
    item.kind === "DIGITAL"
      ? DIGITAL_ICON
      : (FORMAT_ICONS[item.formatCode ?? ""] ?? DEFAULT_STATIC_ICON);
  return `/icons/ooh/${name}.png`;
}

export function formatLabel(item: FormatRef): string {
  if (item.kind === "DIGITAL") return "Pantalla digital";
  return FORMAT_LABELS[item.formatCode ?? ""] ?? item.structureName ?? "Valla";
}

export function isMappable(item: InventoryItem): item is MappableItem {
  const { latitude: lat, longitude: lng } = item;
  return (
    lat != null &&
    lng != null &&
    lat >= SV_BOUNDS.minLat &&
    lat <= SV_BOUNDS.maxLat &&
    lng >= SV_BOUNDS.minLng &&
    lng <= SV_BOUNDS.maxLng
  );
}

export function inventoryBounds(items: MappableItem[]): LngLatBoundsLike | null {
  if (items.length === 0) return null;
  let [minLng, minLat, maxLng, maxLat] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const { longitude, latitude } of items) {
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

export function inventoryRowId(key: string): string {
  return `inventory-row-${key}`;
}
