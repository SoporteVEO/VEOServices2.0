import { Font } from "@react-pdf/renderer";
import { BRAND_FONT_FAMILY, registerBrandFonts } from "./pdf-brand-fonts";

/** Body copy, labels and table cells of customer documents. */
export const DOCUMENT_FONT_FAMILY = BRAND_FONT_FAMILY;

/** Titles, figures and headings (SemiBold only). */
export const DOCUMENT_DISPLAY_FONT_FAMILY = "Funnel Display";

let registered = false;

export function registerDocumentFonts() {
  if (registered) return;
  registered = true;

  registerBrandFonts();
  Font.register({
    family: DOCUMENT_DISPLAY_FONT_FAMILY,
    fonts: [{ src: "/fonts/funnel-display-600.woff", fontWeight: 600 }],
  });
}
