import { StyleSheet } from "@react-pdf/renderer";
import { BRAND_COLORS } from "@/lib/brand-colors";
import { BRAND_FONT_FAMILY } from "@/lib/pdf-brand-fonts";

export const PAGE_PADDING_X = 40;
export const HEADER_HEIGHT = 34;
export const FOOTER_HEIGHT = 40;

/** Sizes come from the brand scale (multiples of 6) plus two small steps. */
export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: BRAND_FONT_FAMILY,
    fontWeight: 400,
    fontSize: 9,
    color: BRAND_COLORS.dark,
    backgroundColor: BRAND_COLORS.white,
    paddingTop: HEADER_HEIGHT + 28,
    paddingBottom: FOOTER_HEIGHT + 16,
    paddingHorizontal: PAGE_PADDING_X,
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    paddingHorizontal: PAGE_PADDING_X,
    backgroundColor: BRAND_COLORS.dark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLogo: { height: 14, objectFit: "contain" },
  headerMeta: {
    fontSize: 7.5,
    color: BRAND_COLORS.mist,
    letterSpacing: 0.6,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: PAGE_PADDING_X,
    right: PAGE_PADDING_X,
    height: FOOTER_HEIGHT,
    borderTopWidth: 0.6,
    borderTopColor: BRAND_COLORS.mist,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerBrand: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerIsotipo: { height: 9, objectFit: "contain" },
  footerText: { fontSize: 7.5, color: BRAND_COLORS.slate },

  eyebrow: {
    fontSize: 7.5,
    fontWeight: 600,
    color: BRAND_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  titleRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  title: {
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1.15,
    color: BRAND_COLORS.dark,
  },
  titleDot: {
    width: 6,
    height: 6,
    marginBottom: 5,
    backgroundColor: BRAND_COLORS.lime,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 300,
    color: BRAND_COLORS.slate,
    marginTop: 4,
  },
  titleBlock: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 0.6,
    borderBottomColor: BRAND_COLORS.mist,
  },

  highlights: { flexDirection: "row", gap: 8, marginBottom: 20 },
  highlight: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS.ice,
  },
  highlightFeatured: { backgroundColor: BRAND_COLORS.dark },
  highlightLabel: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: BRAND_COLORS.gray,
  },
  highlightLabelFeatured: { color: BRAND_COLORS.lime },
  highlightValue: {
    fontSize: 18,
    fontWeight: 600,
    marginTop: 6,
    color: BRAND_COLORS.dark,
  },
  highlightValueFeatured: { color: BRAND_COLORS.white },
  highlightDetail: { fontSize: 7.5, marginTop: 3, color: BRAND_COLORS.slate },
  highlightDetailFeatured: { color: BRAND_COLORS.mist },

  section: { marginBottom: 18 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionMarker: { width: 5, height: 5, backgroundColor: BRAND_COLORS.lime },
  sectionTitle: { fontSize: 12, fontWeight: 600, color: BRAND_COLORS.dark },
  paragraph: { fontSize: 9.5, lineHeight: 1.5, marginBottom: 6 },
  bullet: { flexDirection: "row", gap: 6, marginBottom: 3 },
  bulletMark: {
    width: 3,
    height: 3,
    marginTop: 5,
    backgroundColor: BRAND_COLORS.gray,
  },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.45 },

  chart: { marginBottom: 12 },
  chartTitle: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: BRAND_COLORS.slate,
    marginBottom: 6,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },
  chartLabel: { width: "30%", paddingRight: 8, fontSize: 8.5 },
  chartTrack: {
    flex: 1,
    height: 9,
    backgroundColor: BRAND_COLORS.ice,
    borderRadius: 1,
  },
  chartBar: { height: 9, borderRadius: 1 },
  chartValue: {
    width: "18%",
    textAlign: "right",
    fontSize: 8.5,
    fontWeight: 600,
  },
  chartShare: {
    width: "8%",
    textAlign: "right",
    fontSize: 7.5,
    color: BRAND_COLORS.slate,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_COLORS.dark,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 7,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: BRAND_COLORS.white,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND_COLORS.mist,
  },
  tableRowStriped: { backgroundColor: BRAND_COLORS.snow },
  tableCell: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 8.5 },
  tableTotals: {
    flexDirection: "row",
    backgroundColor: BRAND_COLORS.ice,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.dark,
  },
  tableTotalsCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 8.5,
    fontWeight: 600,
  },
});
