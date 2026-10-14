import { StyleSheet } from "@react-pdf/renderer";
import {
  DOCUMENT_DISPLAY_FONT_FAMILY,
  DOCUMENT_FONT_FAMILY,
} from "@/lib/pdf-document-fonts";

/**
 * VEO customer documents (cotización, contrato) are designed in CSS px at
 * 96 dpi on Letter paper, so every px value is multiplied by 0.75 to land in
 * PDF points.
 */
export const px = (value: number) => value * 0.75;

export const DOC_COLORS = {
  ink: "#1B2629",
  gray: "#4A798C",
  lime: "#BAEB56",
  ice: "#E8F6F9",
  white: "#FFFFFF",
  muted: "#4B5A5F",
  borderDefault: "#A9C3CD",
  borderSubtle: "#D2E3E9",
} as const;

export const DOC_LOGO = {
  src: "/veo-logo-dark.png",
  height: px(30),
  width: (px(30) * 306) / 63,
};

const PAGE_PADDING_X = 0.65 * 72;
const PAGE_PADDING_BOTTOM = 0.5 * 72;
const FOOTER_BLOCK = px(24) + px(10) + px(14);

export const display = {
  fontFamily: DOCUMENT_DISPLAY_FONT_FAMILY,
  fontWeight: 600,
} as const;

export const eyebrow = {
  fontSize: px(8.5),
  letterSpacing: px(8.5) * 0.12,
  color: DOC_COLORS.gray,
} as const;

export const docStyles = StyleSheet.create({
  page: {
    fontFamily: DOCUMENT_FONT_FAMILY,
    fontSize: px(10.5),
    color: DOC_COLORS.ink,
    paddingTop: 0.6 * 72,
    paddingHorizontal: PAGE_PADDING_X,
    paddingBottom: PAGE_PADDING_BOTTOM + FOOTER_BLOCK,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: px(18),
    borderBottomWidth: px(2),
    borderBottomColor: DOC_COLORS.ink,
  },
  headerMeta: {
    alignItems: "flex-end",
    gap: px(2),
  },
  headerCompany: {
    fontSize: px(9),
    letterSpacing: px(9) * 0.14,
    textTransform: "uppercase",
    color: DOC_COLORS.gray,
    fontWeight: 400,
    lineHeight: 1.2,
  },
  headerDate: {
    fontSize: px(10.5),
    fontWeight: 300,
    lineHeight: 1.2,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: px(24),
    marginTop: px(30),
  },
  title: {
    ...display,
    flex: 1,
    fontSize: px(36),
    lineHeight: 0.95,
    letterSpacing: px(36) * -0.01,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(8),
    backgroundColor: DOC_COLORS.ink,
    paddingVertical: px(7),
    paddingHorizontal: px(12),
  },
  badgeText: {
    ...display,
    color: DOC_COLORS.white,
    fontSize: px(14),
    letterSpacing: px(14) * 0.04,
    lineHeight: 1.2,
  },
  badgeDot: {
    width: px(7),
    height: px(7),
    backgroundColor: DOC_COLORS.lime,
  },
  pageTitle: {
    ...display,
    marginTop: px(30),
    fontSize: px(36),
    lineHeight: 1,
    letterSpacing: px(36) * -0.01,
  },

  infoGrid: {
    marginTop: px(22),
    borderTopWidth: px(1),
    borderLeftWidth: px(1),
    borderColor: DOC_COLORS.borderDefault,
  },
  infoRow: {
    flexDirection: "row",
  },
  infoCell: {
    flex: 1,
    paddingVertical: px(12),
    paddingHorizontal: px(14),
    borderRightWidth: px(1),
    borderBottomWidth: px(1),
    borderColor: DOC_COLORS.borderDefault,
    gap: px(6),
  },
  infoCellHighlight: {
    backgroundColor: DOC_COLORS.ink,
    color: DOC_COLORS.white,
  },
  infoLabel: {
    ...eyebrow,
    lineHeight: 1.3,
  },
  infoLabelHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(6),
  },
  infoLabelDot: {
    width: px(6),
    height: px(6),
    backgroundColor: DOC_COLORS.lime,
  },

  tableHeadRow: {
    flexDirection: "row",
    backgroundColor: DOC_COLORS.ice,
    borderBottomWidth: px(2),
    borderBottomColor: DOC_COLORS.ink,
  },
  th: {
    justifyContent: "flex-end",
    paddingVertical: px(8),
    paddingHorizontal: px(10),
  },
  thText: {
    fontWeight: 400,
    fontSize: px(8.5),
    letterSpacing: px(8.5) * 0.1,
    textTransform: "uppercase",
    lineHeight: 1.3,
  },
  tableRow: {
    flexDirection: "row",
  },
  td: {
    padding: px(10),
    borderBottomWidth: px(1),
    borderBottomColor: DOC_COLORS.borderSubtle,
  },
  tdCode: {
    ...display,
  },
  tdArea: {
    color: DOC_COLORS.gray,
  },

  spacer: {
    flexGrow: 1,
    minHeight: px(24),
  },

  signatures: {
    flexDirection: "row",
    gap: px(48),
    paddingBottom: px(12),
  },
  signatureColumn: {
    flex: 1,
    gap: px(4),
  },
  signatureLine: {
    height: px(56),
    borderBottomWidth: px(1),
    borderBottomColor: DOC_COLORS.ink,
  },
  signatureLabel: {
    ...eyebrow,
    fontSize: px(9),
    letterSpacing: px(9) * 0.12,
    marginTop: px(8),
    lineHeight: 1.3,
  },
  signatureName: {
    ...display,
    fontSize: px(13),
    lineHeight: 1.3,
  },

  footer: {
    position: "absolute",
    left: PAGE_PADDING_X,
    right: PAGE_PADDING_X,
    bottom: PAGE_PADDING_BOTTOM,
    flexDirection: "row",
    alignItems: "center",
    gap: px(24),
    paddingTop: px(10),
    borderTopWidth: px(1),
    borderTopColor: DOC_COLORS.borderSubtle,
  },
  footerNote: {
    ...eyebrow,
    flex: 1,
    letterSpacing: px(8.5) * 0.04,
  },
  footerPager: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: px(8),
  },
  /** Any lineHeight on a render-prop Text makes react-pdf drop it. */
  footerPage: {
    ...eyebrow,
    width: px(40),
    textAlign: "right",
  },
  footerDot: {
    width: px(8),
    height: px(8),
  },
});
