import { StyleSheet } from "@react-pdf/renderer";
import {
  display,
  DOC_COLORS,
  eyebrow,
  px,
} from "../document/veo-document-styles";

export const offerStyles = StyleSheet.create({
  intro: {
    marginTop: px(24),
    fontWeight: 300,
    fontSize: px(11),
    lineHeight: 1.65,
  },
  tagline: {
    ...display,
    marginTop: px(8),
    fontSize: px(14),
    lineHeight: 1.3,
    color: DOC_COLORS.gray,
  },

  infoValue: {
    ...display,
    fontSize: px(14),
    lineHeight: 1.1,
  },
  infoValueText: {
    fontSize: px(11),
    fontWeight: 400,
    lineHeight: 1.2,
  },
  infoValueLarge: {
    ...display,
    fontSize: px(16),
    lineHeight: 1.1,
  },

  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(8),
    marginTop: px(26),
  },
  sectionTitleDot: {
    width: px(7),
    height: px(7),
    backgroundColor: DOC_COLORS.ink,
  },
  sectionTitleText: {
    ...display,
    fontSize: px(11),
    letterSpacing: px(11) * 0.02,
    lineHeight: 1.2,
  },

  table: {
    marginTop: px(10),
    fontSize: px(10),
    lineHeight: 1.45,
  },
  tdText: {
    fontWeight: 400,
  },
  description: {
    fontWeight: 300,
  },
  descriptionDetail: {
    marginTop: px(4),
    fontWeight: 300,
    color: DOC_COLORS.muted,
  },
  subtotalRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtotalLabel: {
    padding: px(10),
    fontSize: px(8.5),
    letterSpacing: px(8.5) * 0.1,
    color: DOC_COLORS.gray,
    textAlign: "right",
  },
  subtotalValue: {
    ...display,
    padding: px(10),
    fontSize: px(12),
    textAlign: "right",
  },

  totals: {
    marginTop: px(18),
    marginLeft: "auto",
    width: "58%",
    fontSize: px(10),
    lineHeight: 1.45,
  },
  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: px(1),
    borderBottomColor: DOC_COLORS.borderSubtle,
  },
  totalsLabel: {
    ...eyebrow,
    paddingVertical: px(9),
    paddingHorizontal: px(10),
  },
  totalsValue: {
    paddingVertical: px(9),
    paddingHorizontal: px(10),
    fontWeight: 400,
    textAlign: "right",
  },
  totalsGrandRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DOC_COLORS.ink,
    color: DOC_COLORS.white,
  },
  totalsGrandLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(6),
    paddingVertical: px(11),
    paddingHorizontal: px(10),
  },
  totalsGrandLabelText: {
    ...eyebrow,
    color: DOC_COLORS.lime,
  },
  totalsGrandDot: {
    width: px(6),
    height: px(6),
    backgroundColor: DOC_COLORS.lime,
  },
  totalsGrandValue: {
    ...display,
    paddingVertical: px(11),
    paddingHorizontal: px(10),
    fontSize: px(16),
    lineHeight: 1,
    textAlign: "right",
  },

  paymentBox: {
    marginTop: px(22),
    paddingVertical: px(14),
    paddingHorizontal: px(16),
    backgroundColor: DOC_COLORS.ice,
    gap: px(6),
  },
  paymentText: {
    fontSize: px(11),
    fontWeight: 300,
    lineHeight: 1.65,
  },
  closingTagline: {
    ...display,
    marginTop: px(30),
    fontSize: px(20),
    lineHeight: 1.1,
    letterSpacing: px(20) * -0.01,
    color: DOC_COLORS.gray,
  },
});
