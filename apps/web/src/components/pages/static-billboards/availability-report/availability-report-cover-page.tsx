import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Eyebrow, Field, Logo } from "@/components/pages/reports/pdf/contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "@/components/pages/reports/pdf/contract-report-pdf-styles";
import type { AvailabilityReportCopy } from "./availability-report-data";

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  photoFrame: {
    flex: 1,
    minHeight: 0,
    marginTop: px(48),
    backgroundColor: REPORT_COLORS.dark60,
  },
  photo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  hero: {
    gap: px(24),
    paddingVertical: px(48),
  },
  title: {
    ...displayText(72, 0.95),
    color: REPORT_COLORS.white,
  },
  lead: {
    maxWidth: px(34 * 0.55 * 18),
    fontWeight: 300,
    fontSize: px(18),
    lineHeight: 1.5,
    color: REPORT_COLORS.gray20,
  },
  facts: {
    flexDirection: "row",
    gap: px(24),
    borderTopWidth: px(1),
    borderTopColor: REPORT_COLORS.dark60,
    paddingTop: px(24),
  },
  fact: {
    flex: 1,
  },
});

export function AvailabilityReportCoverPage({
  copy,
  photo,
}: {
  copy: AvailabilityReportCopy;
  photo: string | null;
}) {
  return (
    <Page size="LETTER" style={[s.page, s.pageDark]}>
      <View style={styles.top}>
        <Logo variant="light" height={30} />
        <Eyebrow style={s.eyebrowOnDark}>{copy.coverDate}</Eyebrow>
      </View>

      <View style={styles.photoFrame}>
        {photo ? <Image src={photo} style={styles.photo} /> : null}
      </View>

      <View style={styles.hero}>
        <Eyebrow style={s.eyebrowOnDark}>Disponibilidad de vallas</Eyebrow>
        <Text style={styles.title}>{copy.coverTitle}</Text>
        <Text style={styles.lead}>{copy.coverLead}</Text>
      </View>

      <View style={styles.facts}>
        <Field onDark label="Vallas disponibles" value={copy.countLabel} style={styles.fact} />
        <Field onDark label="Zona" value={copy.zone} style={styles.fact} />
        <Field onDark label="Disponibilidad" value={copy.availability} style={styles.fact} />
      </View>
    </Page>
  );
}
