import type { CSSProperties } from "react";

/** UI glyph (Lucide paths, square caps). Names: arrow-up-right, arrow-right, arrow-left, check, x, chevron-down, chevron-right, search, bell, map-pin, calendar, download, plus, filter, eye, triangle-alert, info, monitor, file-text, log-out, settings, layout-grid, list, shield-check, clock, image, upload, user, menu, camera, ellipsis, chart-column, wifi-off, route */
export interface GlyphProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  title?: string;
  style?: CSSProperties;
}
export declare function Glyph(props: GlyphProps): JSX.Element | null;
export declare const GLYPH_NAMES: string[];
