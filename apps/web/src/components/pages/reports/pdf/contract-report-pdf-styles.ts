import { StyleSheet } from "@react-pdf/renderer";
import {
  DOCUMENT_DISPLAY_FONT_FAMILY,
  DOCUMENT_FONT_FAMILY,
} from "@/lib/pdf-document-fonts";

/**
 * The billboard report is designed in CSS px at 96 dpi on Letter paper
 * (816 × 1056 px), so every px value is multiplied by 0.75 to land in PDF
 * points.
 */
export const px = (value: number) => value * 0.75;

export const PAGE_WIDTH = 816;
export const PAGE_HEIGHT = 1056;
export const PAGE_PADDING = 48;

export const REPORT_COLORS = {
  dark: "#1B2629",
  dark60: "#4B5A5F",
  gray: "#4A798C",
  gray40: "#A9C3CD",
  gray20: "#D2E3E9",
  ice: "#E8F6F9",
  white: "#FFFFFF",
  lime: "#BAEB56",
} as const;

const display = {
  fontFamily: DOCUMENT_DISPLAY_FONT_FAMILY,
  fontWeight: 600,
} as const;

const tracking = (size: number, em: number) => px(size * em);

export const displayText = (size: number, lineHeight: number) => ({
  ...display,
  fontSize: px(size),
  lineHeight,
  letterSpacing: tracking(size, -0.02),
});

export const reportStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: px(PAGE_PADDING),
    fontFamily: DOCUMENT_FONT_FAMILY,
    backgroundColor: REPORT_COLORS.white,
    color: REPORT_COLORS.dark,
  },
  pageDark: {
    backgroundColor: REPORT_COLORS.dark,
    color: REPORT_COLORS.white,
  },
  pageIce: {
    backgroundColor: REPORT_COLORS.ice,
  },

  eyebrow: {
    fontWeight: 600,
    fontSize: px(12),
    lineHeight: 1,
    letterSpacing: tracking(12, 0.08),
    textTransform: "uppercase",
    color: REPORT_COLORS.gray,
  },
  eyebrowOnDark: {
    color: REPORT_COLORS.gray40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: px(18),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray20,
  },
  headerOnIce: {
    borderBottomColor: REPORT_COLORS.gray40,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: px(36),
  },
  footerText: {
    fontWeight: 400,
    fontSize: px(12),
    lineHeight: 1,
    color: REPORT_COLORS.gray,
  },
  footerPager: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(6),
  },
  square: {
    width: px(6),
    height: px(6),
    backgroundColor: REPORT_COLORS.dark,
  },

  intro: {
    gap: px(24),
    paddingTop: px(72),
  },
  sectionTitle: {
    ...displayText(48, 1.1),
    maxWidth: px(16 * 0.575 * 48),
  },
  lead: {
    maxWidth: px(52 * 0.55 * 18),
    fontWeight: 300,
    fontSize: px(18),
    lineHeight: 1.6,
    color: REPORT_COLORS.dark60,
  },
  spacer: {
    flexGrow: 1,
  },

  field: {
    gap: px(6),
  },
  fieldValue: {
    fontWeight: 400,
    fontSize: px(16),
    lineHeight: 1.4,
  },

  seal: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: px(18),
    paddingVertical: px(18),
    paddingHorizontal: px(24),
    backgroundColor: REPORT_COLORS.dark,
    color: REPORT_COLORS.white,
  },
  sealBody: {
    gap: px(6),
    borderLeftWidth: px(1),
    borderLeftColor: REPORT_COLORS.dark60,
    paddingLeft: px(18),
  },
  sealValue: {
    ...displayText(36, 1),
    color: REPORT_COLORS.lime,
  },
  sealLabel: {
    fontWeight: 400,
    fontSize: px(12),
    lineHeight: 1.3,
  },
  sealMeta: {
    fontWeight: 400,
    fontSize: px(12),
    lineHeight: 1.3,
    color: REPORT_COLORS.gray40,
  },

  statTile: {
    flex: 1,
    justifyContent: "flex-end",
    gap: px(6),
    padding: px(24),
  },
  statLabel: {
    fontWeight: 400,
    fontSize: px(14),
    lineHeight: 1.25,
    maxWidth: px(180),
  },
});
