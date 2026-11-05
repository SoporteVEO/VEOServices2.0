import { StyleSheet } from "@react-pdf/renderer";
import {
  display,
  DOC_COLORS,
  eyebrow,
  px,
} from "@/components/pages/my-space/document/veo-document-styles";

export const mentorshipStyles = StyleSheet.create({
  intro: {
    marginTop: px(16),
    fontWeight: 300,
    fontSize: px(11),
    lineHeight: 1.65,
  },
  introStrong: {
    fontWeight: 600,
  },

  infoValue: {
    ...display,
    fontSize: px(14),
    lineHeight: 1.15,
  },
  infoValueHighlight: {
    ...display,
    fontSize: px(14),
    lineHeight: 1.15,
    color: DOC_COLORS.white,
  },

  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(8),
    marginTop: px(18),
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
    marginTop: px(8),
    fontSize: px(10),
    lineHeight: 1.45,
  },
  tdText: {
    fontWeight: 300,
  },
  kssLabel: {
    ...display,
    fontSize: px(12),
    lineHeight: 1.1,
  },
  kssHint: {
    ...eyebrow,
    marginTop: px(3),
    lineHeight: 1.3,
  },
  outcome: {
    ...display,
    fontSize: px(11),
  },

  box: {
    marginTop: px(8),
    paddingVertical: px(10),
    paddingHorizontal: px(16),
    backgroundColor: DOC_COLORS.ice,
    gap: px(4),
  },
  boxText: {
    fontSize: px(11),
    fontWeight: 300,
    lineHeight: 1.6,
  },
  boxNote: {
    ...eyebrow,
    lineHeight: 1.4,
  },
  boxComment: {
    marginTop: px(4),
    fontSize: px(10),
    fontWeight: 300,
    lineHeight: 1.5,
    color: DOC_COLORS.muted,
  },
});
