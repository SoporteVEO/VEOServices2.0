import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { formatPageNumber, formatReportDate } from "../contract-report-pdf-data";
import { Eyebrow, Field, PageFooter, PageHeader } from "../contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "../contract-report-pdf-styles";
import {
  formatPlace,
  formatProposalMoney,
  formatProposalSize,
  type ClientProposalPdfData,
  type ProposalPdfBillboard,
} from "./client-proposal-pdf-data";

const styles = StyleSheet.create({
  section: {
    gap: px(12),
    paddingTop: px(48),
  },
  title: displayText(36, 1.1),
  row: {
    flexDirection: "row",
  },
  th: {
    paddingVertical: px(12),
    paddingHorizontal: px(10),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.dark,
  },
  td: {
    paddingVertical: px(12),
    paddingHorizontal: px(10),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray20,
  },
  total: {
    paddingVertical: px(14),
    paddingHorizontal: px(10),
    backgroundColor: REPORT_COLORS.dark,
    color: REPORT_COLORS.white,
  },
  firstCell: { paddingLeft: 0 },
  lastCell: { paddingRight: 0, alignItems: "flex-end" },
  totalFirst: { paddingLeft: px(12) },
  totalLast: { paddingRight: px(12), alignItems: "flex-end" },
  code: displayText(15, 1.4),
  address: {
    fontWeight: 300,
    fontSize: px(13),
    lineHeight: 1.35,
  },
  place: {
    fontWeight: 400,
    fontSize: px(11),
    lineHeight: 1.3,
    color: REPORT_COLORS.gray,
  },
  cell: {
    fontWeight: 400,
    fontSize: px(13),
    lineHeight: 1.4,
  },
  totalValue: {
    ...displayText(18, 1.2),
    color: REPORT_COLORS.lime,
  },
  note: {
    marginTop: px(18),
    fontWeight: 400,
    fontSize: px(12),
    lineHeight: 1.5,
    color: REPORT_COLORS.dark60,
  },
  signature: {
    flexDirection: "row",
    gap: px(24),
    borderTopWidth: px(1),
    borderTopColor: REPORT_COLORS.dark,
    paddingTop: px(18),
  },
  signatureField: { flex: 1 },
});

const COLUMNS: Style[] = [
  { width: px(96) },
  { flex: 1 },
  { width: px(110) },
  { width: px(100) },
  { width: px(44) },
];

function cell(column: number, base: Style, edge = true): Style[] {
  return [
    base,
    COLUMNS[column]!,
    edge && column === 0 ? styles.firstCell : {},
    edge && column === COLUMNS.length - 1 ? styles.lastCell : {},
  ];
}

export interface InvestmentRow {
  billboard: ProposalPdfBillboard;
  pageNumber: number;
}

export function ClientProposalInvestmentPage({
  data,
  rows,
  pageNumber,
  isLast,
}: {
  data: ClientProposalPdfData;
  rows: InvestmentRow[];
  pageNumber: number;
  isLast: boolean;
}) {
  const headings = ["Código", "Ubicación", "Medidas", "Tarifa / mes", "Pág."];

  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label={`Propuesta · ${data.company}`} />
      <View style={styles.section}>
        <Eyebrow>Inversión</Eyebrow>
        <Text style={styles.title}>Espacios recomendados</Text>
        <View>
          <View style={styles.row}>
            {headings.map((heading, column) => (
              <View key={heading} style={cell(column, styles.th)}>
                <Eyebrow>{heading}</Eyebrow>
              </View>
            ))}
          </View>
          {rows.map(({ billboard, pageNumber: page }) => (
            <View key={page} style={styles.row} wrap={false}>
              <View style={cell(0, styles.td)}>
                <Text style={styles.code}>{billboard.code}</Text>
              </View>
              <View style={cell(1, styles.td)}>
                <Text style={styles.address}>{billboard.address || "—"}</Text>
                <Text style={styles.place}>{formatPlace(billboard)}</Text>
              </View>
              <View style={cell(2, styles.td)}>
                <Text style={styles.cell}>
                  {formatProposalSize(billboard.width, billboard.height)}
                </Text>
              </View>
              <View style={cell(3, styles.td)}>
                <Text style={styles.cell}>{formatProposalMoney(billboard.monthlyPrice)}</Text>
              </View>
              <View style={cell(4, styles.td)}>
                <Text style={styles.cell}>{formatPageNumber(page)}</Text>
              </View>
            </View>
          ))}
          {isLast ? (
            <View style={styles.row} wrap={false}>
              <View style={[styles.total, styles.totalFirst, { flex: 1 }]}>
                <Text style={styles.cell}>Inversión mensual de referencia</Text>
              </View>
              <View style={[styles.total, styles.totalLast, { width: px(154) }]}>
                <Text style={styles.totalValue}>
                  {formatProposalMoney(data.monthlyInvestment)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
        {isLast ? (
          <Text style={styles.note}>
            Tarifas de referencia de renta mensual por espacio, sujetas a
            disponibilidad y a confirmación en la cotización formal.
          </Text>
        ) : null}
      </View>

      <View style={s.spacer} />
      {isLast ? (
        <View style={styles.signature}>
          <Field
            label="Preparado por"
            value={data.preparedBy || data.preparedByEmail}
            style={styles.signatureField}
          />
          <Field label="Contacto" value={data.preparedByEmail} style={styles.signatureField} />
          <Field
            label="Fecha"
            value={formatReportDate(data.createdAt)}
            style={styles.signatureField}
          />
        </View>
      ) : null}
      <PageFooter label={data.company} pageNumber={pageNumber} />
    </Page>
  );
}
