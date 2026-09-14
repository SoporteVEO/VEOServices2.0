import { Font } from "@react-pdf/renderer";

/**
 * The signed contract template is set in Calibri. Carlito is metric-compatible
 * with it — same advance widths — so reusing the template's font sizes and column
 * widths reproduces the original's line breaks instead of approximating them.
 */
export const CONTRACT_FONT_FAMILY = "Carlito";

let registered = false;

export function registerContractFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: CONTRACT_FONT_FAMILY,
    fonts: [
      { src: "/fonts/carlito-400.woff", fontWeight: 400 },
      { src: "/fonts/carlito-700.woff", fontWeight: 700 },
      {
        src: "/fonts/carlito-400-italic.woff",
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: "/fonts/carlito-700-italic.woff",
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });

  // Word does not hyphenate this template, so neither should we: hyphenation
  // would change where every justified line breaks.
  Font.registerHyphenationCallback((word) => [word]);
}
