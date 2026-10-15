import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Eyebrow, Field, PageFooter, PageHeader, StatTile } from "../contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "../contract-report-pdf-styles";
import {
  countCities,
  formatProposalMoney,
  type ClientProposalPdfData,
} from "./client-proposal-pdf-data";

const styles = StyleSheet.create({
  intro: {
    gap: px(24),
    paddingTop: px(48),
  },
  objective: {
    ...displayText(36, 1.15),
  },
  summary: {
    fontWeight: 300,
    fontSize: px(17),
    lineHeight: 1.6,
    color: REPORT_COLORS.dark60,
  },
  audience: {
    marginTop: px(24),
    paddingTop: px(18),
    borderTopWidth: px(1),
    borderTopColor: REPORT_COLORS.gray20,
  },
  tiles: {
    flexDirection: "row",
    gap: px(12),
  },
  list: {
    borderTopWidth: px(1),
    borderTopColor: REPORT_COLORS.dark,
  },
  row: {
    flexDirection: "row",
    gap: px(24),
    paddingVertical: px(18),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray40,
  },
  number: {
    ...displayText(18, 1),
    letterSpacing: 0,
    width: px(48),
    marginTop: px(5),
    color: REPORT_COLORS.gray,
  },
  text: {
    flex: 1,
    fontWeight: 300,
    fontSize: px(20),
    lineHeight: 1.35,
  },
});

interface BriefPageProps {
  data: ClientProposalPdfData;
  pageNumber: number;
}

export function ClientProposalContextPage({ data, pageNumber }: BriefPageProps) {
  const stats = [
    { value: String(data.billboards.length), label: "espacios recomendados" },
    { value: String(countCities(data.billboards) || "—"), label: "municipios cubiertos" },
    {
      value: formatProposalMoney(data.monthlyInvestment),
      label: "inversión mensual de referencia",
    },
  ];

  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label={`Propuesta · ${data.company}`} />
      <View style={styles.intro}>
        <Eyebrow>Objetivo</Eyebrow>
        <Text style={styles.objective}>{data.objective}</Text>
        <Eyebrow>{`Sobre ${data.company}`}</Eyebrow>
        <Text style={styles.summary}>{data.brandSummary}</Text>
      </View>
      {data.audience ? (
        <Field label="Audiencia" value={data.audience} style={styles.audience} />
      ) : null}
      <View style={s.spacer} />
      <View style={styles.tiles}>
        <StatTile stat={stats[0]!} tone="inverse" />
        <StatTile stat={stats[1]!} />
        <StatTile stat={stats[2]!} />
      </View>
      <PageFooter label={data.company} pageNumber={pageNumber} />
    </Page>
  );
}

export function ClientProposalStrategyPage({ data, pageNumber }: BriefPageProps) {
  return (
    <Page size="LETTER" style={[s.page, s.pageIce]}>
      <PageHeader label={`Propuesta · ${data.company}`} onIce />
      <View style={s.intro}>
        <Eyebrow>Estrategia</Eyebrow>
        <Text style={s.sectionTitle}>Por qué esta selección de espacios.</Text>
      </View>
      <View style={s.spacer} />
      <View style={styles.list}>
        {data.strategy.map((item, index) => (
          <View key={index} style={styles.row} wrap={false}>
            <Text style={styles.number}>{String(index + 1).padStart(2, "0")}</Text>
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
      </View>
      <PageFooter label={data.company} pageNumber={pageNumber} />
    </Page>
  );
}
