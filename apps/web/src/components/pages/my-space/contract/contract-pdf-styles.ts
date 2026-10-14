import { StyleSheet } from "@react-pdf/renderer";
import {
  display,
  DOC_COLORS,
  px,
} from "../document/veo-document-styles";

export const contractStyles = StyleSheet.create({
  parties: {
    marginTop: px(24),
    fontWeight: 300,
    fontSize: px(11),
    lineHeight: 1.65,
    textAlign: "justify",
  },

  summaryValue: {
    ...display,
    fontSize: px(20),
    lineHeight: 1,
  },
  summaryValueSmall: {
    ...display,
    fontSize: px(16),
    lineHeight: 1,
  },

  table: {
    marginTop: px(22),
    fontSize: px(10),
    lineHeight: 1.45,
  },
  tdLight: {
    fontWeight: 300,
  },

  ivaNote: {
    marginTop: px(10),
    fontSize: px(9.5),
    lineHeight: 1.55,
    fontWeight: 300,
    color: DOC_COLORS.muted,
  },

  acknowledgement: {
    marginTop: px(22),
    fontSize: px(11),
    fontWeight: 300,
    lineHeight: 1.65,
    paddingVertical: px(14),
    paddingHorizontal: px(16),
    backgroundColor: DOC_COLORS.ice,
  },

  clauseColumns: {
    flexDirection: "row",
    marginTop: px(22),
    fontSize: px(10),
    lineHeight: 1.55,
    fontWeight: 300,
  },
  clauseColumnLeft: {
    flex: 1,
    paddingRight: px(15),
    borderRightWidth: px(1),
    borderRightColor: DOC_COLORS.borderSubtle,
  },
  clauseColumnRight: {
    flex: 1,
    paddingLeft: px(15),
  },
  clause: {
    marginBottom: px(14),
  },
  clauseHead: {
    flexDirection: "row",
    gap: px(8),
    marginBottom: px(4),
  },
  clauseNumeral: {
    ...display,
    fontSize: px(11),
    color: DOC_COLORS.gray,
    minWidth: px(22),
  },
  clauseTitle: {
    ...display,
    flex: 1,
    fontSize: px(11),
    letterSpacing: px(11) * 0.02,
  },
  clauseBody: {
    textAlign: "justify",
  },
});
