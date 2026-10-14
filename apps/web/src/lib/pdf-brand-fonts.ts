import { Font } from "@react-pdf/renderer";

/**
 * Funnel Sans is the brand typeface (Manual de Marca 2026): SemiBold for
 * titles, Light for large body copy and Regular for small print, where Light
 * gets too thin to read.
 */
export const BRAND_FONT_FAMILY = "Funnel Sans";

let registered = false;

export function registerBrandFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: BRAND_FONT_FAMILY,
    fonts: [
      { src: "/fonts/funnel-sans-300.woff", fontWeight: 300 },
      { src: "/fonts/funnel-sans-400.woff", fontWeight: 400 },
      { src: "/fonts/funnel-sans-600.woff", fontWeight: 600 },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
}
