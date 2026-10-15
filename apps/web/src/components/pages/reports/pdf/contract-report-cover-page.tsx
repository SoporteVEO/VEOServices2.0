import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  formatBillboardCount,
  splitPeriodTitle,
  type ContractReportPdfData,
} from "./contract-report-pdf-data";
import { Eyebrow, Field, Logo } from "./contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "./contract-report-pdf-styles";

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
    ...displayText(96, 0.95),
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

export function ContractReportCoverPage({ data }: { data: ContractReportPdfData }) {
  const lead = data.campaign
    ? `Campaña ${data.campaign} en exhibición. Evidencia fotográfica y ubicación de cada valla.`
    : "Su campaña en exhibición. Evidencia fotográfica y ubicación de cada valla.";

  return (
    <Page size="LETTER" style={[s.page, s.pageDark]}>
      <View style={styles.top}>
        <Logo variant="light" height={30} />
        <Eyebrow style={s.eyebrowOnDark}>{`Contrato ${data.contractNumber}`}</Eyebrow>
      </View>

      <View style={styles.hero}>
        <Eyebrow style={s.eyebrowOnDark}>Reporte de vallas</Eyebrow>
        <Text style={styles.title}>{splitPeriodTitle(data.period)}</Text>
        <Text style={styles.lead}>{lead}</Text>
      </View>

      <View style={styles.facts}>
        <Field onDark label="Cliente" value={data.customerName || "—"} style={styles.fact} />
        <Field onDark label="Contacto" value={data.customerEmail || "—"} style={styles.fact} />
        <Field
          onDark
          label="Vallas incluidas"
          value={formatBillboardCount(data.billboards.length)}
          style={styles.fact}
        />
      </View>
    </Page>
  );
}
