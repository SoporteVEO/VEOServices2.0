import type { StyleSpecification } from "maplibre-gl";
import type {
  ExpansionSitePriority,
  ExpansionSiteStatus,
  ProfitabilityTier,
} from "@/api/expansion/expansion.types";
import { formatLabel } from "@/components/pages/crm/inventory/inventory-format";

export const TIER_ORDER: ProfitabilityTier[] = ["HIGH", "MEDIUM", "LOW", "CRITICAL"];

export const TIER_META: Record<ProfitabilityTier, { label: string; color: string }> = {
  HIGH: { label: "Alta", color: "#16a34a" },
  MEDIUM: { label: "Media", color: "#ca8a04" },
  LOW: { label: "Baja", color: "#ea580c" },
  CRITICAL: { label: "Crítica", color: "#dc2626" },
};

export const OCCUPIED_COLOR = "#2563eb";
export const AVAILABLE_COLOR = "#64748b";
export const SITE_COLOR = "#7c3aed";
export const SCREEN_COLOR = "#0891b2";

export type ColorMode = "profitability" | "occupancy" | "status";

export const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  profitability: "Rentabilidad",
  occupancy: "Ocupación",
  status: "Estado actual",
};

export function scoreTier(score: number): ProfitabilityTier {
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  if (score >= 25) return "LOW";
  return "CRITICAL";
}

export function occupancyTier(rate: number): ProfitabilityTier {
  return scoreTier(rate * 100);
}

export const SITE_STATUS_META: Record<
  ExpansionSiteStatus,
  { label: string; color: string; badge: "info" | "warning" | "success" | "ghost" }
> = {
  PROPOSED: { label: "Propuesta", color: "#7c3aed", badge: "info" },
  EVALUATING: { label: "En evaluación", color: "#0284c7", badge: "warning" },
  APPROVED: { label: "Aprobada", color: "#16a34a", badge: "success" },
  DISCARDED: { label: "Descartada", color: "#94a3b8", badge: "ghost" },
};

export const SITE_STATUSES = Object.keys(SITE_STATUS_META) as ExpansionSiteStatus[];

export const SITE_PRIORITY_LABELS: Record<ExpansionSitePriority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

export const SITE_PRIORITIES = Object.keys(SITE_PRIORITY_LABELS) as ExpansionSitePriority[];

export const FORMAT_OPTIONS = ["VS", "VE", "MV", "TR", "PT", "PS", "PLT", "VD"].map((code) => ({
  value: code,
  label: formatLabel({ kind: "STATIC", formatCode: code, structureName: null }),
}));

export type BaseLayer = "streets" | "satellite" | "hybrid" | "terrain" | "dark";

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const ESRI_ATTRIBUTION = "Tiles &copy; Esri, Maxar, Earthstar Geographics";
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function esriRaster(services: string[]): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: Object.fromEntries(
      services.map((service) => [
        service,
        {
          type: "raster",
          tiles: [`${ESRI}/${service}/MapServer/tile/{z}/{y}/{x}`],
          tileSize: 256,
          maxzoom: 19,
          attribution: ESRI_ATTRIBUTION,
        },
      ]),
    ),
    layers: services.map((service) => ({ id: service, type: "raster", source: service })),
  };
}

function fixed(style: string | StyleSpecification) {
  return { light: style, dark: style };
}

export const BASE_LAYERS: Record<
  BaseLayer,
  { label: string; styles?: { light: string | StyleSpecification; dark: string | StyleSpecification } }
> = {
  streets: { label: "Calles" },
  satellite: { label: "Satélite", styles: fixed(esriRaster(["World_Imagery"])) },
  hybrid: {
    label: "Híbrido",
    styles: fixed(
      esriRaster([
        "World_Imagery",
        "Reference/World_Transportation",
        "Reference/World_Boundaries_and_Places",
      ]),
    ),
  },
  terrain: { label: "Terreno", styles: fixed(esriRaster(["World_Topo_Map"])) },
  dark: { label: "Nocturno", styles: fixed(DARK_STYLE) },
};

export const BASE_LAYER_ORDER = Object.keys(BASE_LAYERS) as BaseLayer[];

export interface MapLayers {
  billboards: boolean;
  clusters: boolean;
  sites: boolean;
  screens: boolean;
  profitHeat: boolean;
  densityHeat: boolean;
  coverage: boolean;
}

export const DEFAULT_LAYERS: MapLayers = {
  billboards: true,
  clusters: true,
  sites: true,
  screens: false,
  profitHeat: false,
  densityHeat: false,
  coverage: false,
};

export const LAYER_LABELS: Record<keyof MapLayers, { label: string; description: string }> = {
  billboards: { label: "Vallas", description: "Vallas propias coloreadas por indicador" },
  clusters: { label: "Agrupar vallas", description: "Agrupa vallas cercanas al alejar el mapa" },
  sites: { label: "Ubicaciones planificadas", description: "Sitios imaginarios en evaluación" },
  screens: { label: "Pantallas digitales", description: "Pantallas DOOH registradas" },
  profitHeat: { label: "Mapa de calor · rentabilidad", description: "Zonas donde las vallas rinden más" },
  densityHeat: { label: "Mapa de calor · densidad", description: "Concentración de vallas (saturación)" },
  coverage: { label: "Radio de cobertura", description: "Área de influencia de cada valla" },
};

export const COVERAGE_RADIUS_OPTIONS = [250, 500, 1000, 2000];
export const ANALYSIS_RADIUS_OPTIONS = [1, 2, 3, 5];

export const DOCUMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.pptx,.csv,.txt,.kml,.kmz";

const EXTENSION_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  txt: "text/plain",
  kml: "application/vnd.google-earth.kml+xml",
  kmz: "application/vnd.google-earth.kmz",
};

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

/** Browsers report an empty type for KML/KMZ and some Office files, so fall back to the extension. */
export function resolveDocumentMime(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExtension = EXTENSION_MIME[extension];
  if (!byExtension) return null;
  if (file.type && Object.values(EXTENSION_MIME).includes(file.type)) return file.type;
  return byExtension;
}

export function streetViewUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value == null) return "-";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
