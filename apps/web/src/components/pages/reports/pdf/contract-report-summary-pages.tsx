import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import {
  formatPageNumber,
  formatReportDate,
  INDEX_COLUMNS,
  type ContractReportPdfData,
  type IndexRow,
} from "./contract-report-pdf-data";
import {
  Eyebrow,
  Field,
  PageFooter,
  PageHeader,
  VerificationSeal,
} from "./contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "./contract-report-pdf-styles";

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: px(48),
    borderTopWidth: px(1),
    borderTopColor: REPORT_COLORS.dark,
  },
  gridCell: {
    width: "50%",
    paddingVertical: px(18),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray20,
  },
  gridCellLeft: {
    paddingRight: px(18),
  },
  gridCellRight: {
    paddingLeft: px(18),
  },
  indexSection: {
    gap: px(12),
    paddingTop: px(72),
  },
  row: {
    flexDirection: "row",
  },
  th: {
    paddingVertical: px(12),
    paddingHorizontal: px(12),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.dark,
  },
  td: {
    padding: px(12),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray20,
  },
  firstCell: {
    paddingLeft: 0,
  },
  lastCell: {
    paddingRight: 0,
    alignItems: "flex-end",
  },
  code: displayText(16, 1.4),
  address: {
    fontWeight: 300,
    fontSize: px(14),
    lineHeight: 1.4,
  },
  cellText: {
    fontWeight: 400,
    fontSize: px(14),
    lineHeight: 1.4,
  },
});

const COLUMN_STYLES: Style[] = [
  { width: px(INDEX_COLUMNS.code) },
  { flex: 1 },
  { width: px(INDEX_COLUMNS.date) },
  { width: px(INDEX_COLUMNS.page) },
];

function cellStyle(column: number, base: Style): Style[] {
  return [
    base,
    COLUMN_STYLES[column]!,
    column === 0 ? styles.firstCell : {},
    column === COLUMN_STYLES.length - 1 ? styles.lastCell : {},
  ];
}

export function ContractReportSummaryPage({
  data,
  pageNumber,
  showSeal,
}: {
  data: ContractReportPdfData;
  pageNumber: number;
  showSeal: boolean;
}) {
  const campaignLabel = data.campaign ? `la campaña ${data.campaign}` : "su campaña";
  const summary = [
    { label: "Contrato", value: data.contractNumber },
    { label: "Campaña", value: data.campaign || "—" },
    { label: "Cliente", value: data.customerName || "—" },
    { label: "Periodo", value: data.period },
  ];

  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label={`Reporte de vallas · ${data.period}`} />

      <View style={s.intro}>
        <Eyebrow>Resumen</Eyebrow>
        <Text style={s.sectionTitle}>
          Su campaña está en exhibición. Aquí está la evidencia.
        </Text>
        <Text style={s.lead}>
          {`Este reporte documenta la exhibición de ${campaignLabel} durante ${data.period.toLowerCase()}, bajo el contrato ${data.contractNumber}. Cada valla incluye su código, dirección, ubicación en mapa y una fotografía tomada en sitio con fecha y hora de registro.`}
        </Text>
      </View>

      <View style={styles.grid}>
        {summary.map((item, index) => (
          <Field
            key={item.label}
            label={item.label}
            value={item.value}
            style={{
              ...styles.gridCell,
              ...(index % 2 === 0 ? styles.gridCellLeft : styles.gridCellRight),
            }}
          />
        ))}
      </View>

      <View style={s.spacer} />
      {showSeal ? (
        <VerificationSeal
          value={`${data.billboards.length} de ${data.totalBillboards}`}
          label="vallas con evidencia fotográfica"
          meta={`Contrato ${data.contractNumber} · ${data.period}`}
        />
      ) : null}
      <PageFooter label={data.contractNumber} pageNumber={pageNumber} />
    </Page>
  );
}

export function ContractReportIndexPage({
  data,
  rows,
  pageNumber,
}: {
  data: ContractReportPdfData;
  rows: IndexRow[];
  pageNumber: number;
}) {
  const headings = ["Código", "Dirección", "Registro", "Pág."];

  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label={`Reporte de vallas · ${data.period}`} />

      <View style={styles.indexSection}>
        <Eyebrow>Vallas en este reporte</Eyebrow>
        <View>
          <View style={styles.row}>
            {headings.map((heading, column) => (
              <View key={heading} style={cellStyle(column, styles.th)}>
                <Eyebrow>{heading}</Eyebrow>
              </View>
            ))}
          </View>
          {rows.map(({ billboard, pageNumber: billboardPage }) => (
            <View key={billboardPage} style={styles.row} wrap={false}>
              <View style={cellStyle(0, styles.td)}>
                <Text style={styles.code}>{billboard.code || "—"}</Text>
              </View>
              <View style={cellStyle(1, styles.td)}>
                <Text style={styles.address}>{billboard.address || "—"}</Text>
              </View>
              <View style={cellStyle(2, styles.td)}>
                <Text style={styles.cellText}>
                  {billboard.capturedAt ? formatReportDate(billboard.capturedAt) : "—"}
                </Text>
              </View>
              <View style={cellStyle(3, styles.td)}>
                <Text style={styles.cellText}>{formatPageNumber(billboardPage)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={s.spacer} />
      <PageFooter label={data.contractNumber} pageNumber={pageNumber} />
    </Page>
  );
}
