import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatBillboardCount } from "../contract-report-pdf-data";
import { Eyebrow, Field, Logo } from "../contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "../contract-report-pdf-styles";
import type { ClientProposalPdfData } from "./client-proposal-pdf-data";

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  hero: {
    flex: 1,
    justifyContent: "flex-end",
    gap: px(24),
    paddingBottom: px(72),
  },
  title: {
    ...displayText(88, 0.95),
    color: REPORT_COLORS.white,
  },
  lead: {
    maxWidth: px(30 * 0.55 * 24),
    fontWeight: 300,
    fontSize: px(24),
    lineHeight: 1.4,
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

export function ClientProposalCoverPage({ data }: { data: ClientProposalPdfData }) {
  const addressee = data.contactName
    ? `${data.contactName} · ${data.contactRole}`
    : data.contactRole;

  return (
    <Page size="LETTER" style={[s.page, s.pageDark]}>
      <View style={styles.top}>
        <Logo variant="light" height={30} />
        <Eyebrow style={s.eyebrowOnDark}>Propuesta comercial</Eyebrow>
      </View>

      <View style={styles.hero}>
        <Eyebrow style={s.eyebrowOnDark}>{`Preparada para ${data.company}`}</Eyebrow>
        <Text style={styles.title}>{data.company}</Text>
        <Text style={styles.lead}>{data.objective}</Text>
      </View>

      <View style={styles.facts}>
        <Field onDark label="Dirigida a" value={addressee} style={styles.fact} />
        <Field onDark label="Periodo" value={data.period} style={styles.fact} />
        <Field
          onDark
          label="Espacios"
          value={formatBillboardCount(data.billboards.length)}
          style={styles.fact}
        />
      </View>
    </Page>
  );
}
