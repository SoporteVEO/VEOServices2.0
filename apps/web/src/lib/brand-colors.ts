/**
 * VEO brand palette (Manual de Marca, agosto 2026). Everything rendered outside
 * the Tailwind theme (PDFs, PowerPoint reports, canvases) reads from here.
 * Lime signals, it never decorates: keep it for highlights, never the logo.
 */
export const BRAND_COLORS = {
  dark: "#1B2229",
  darkSurface: "#24303A",
  gray: "#4A798C",
  lime: "#BAEB56",
  /** Lime darkened enough to read as text on white. */
  limeDeep: "#5E7F1F",
  ice: "#E8F6F9",
  slate: "#5B6670",
  steel: "#9AA7AE",
  mist: "#C9D3D8",
  cloud: "#F1F1F1",
  snow: "#FAFAFA",
  white: "#FFFFFF",
  red: "#9B4343",
  redSoft: "#FBE9E9",
  redDeep: "#6B3232",
} as const;

/**
 * Series colours for charts with many categories. The brand has four colours,
 * so tints of VEO Gray and Lime plus a warm contrast keep neighbours distinct.
 */
export const BRAND_CHART_COLORS = [
  BRAND_COLORS.gray,
  BRAND_COLORS.lime,
  BRAND_COLORS.dark,
  BRAND_COLORS.steel,
  "#7FB6C8",
  BRAND_COLORS.limeDeep,
  BRAND_COLORS.red,
  "#D9A441",
] as const;

/** pptxgenjs expects hex without the leading `#`. */
export function pptxColor(hex: string): string {
  return hex.replace("#", "");
}
