import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { formatPageNumber } from "@/components/pages/reports/pdf/contract-report-pdf-data";
import {
  Eyebrow,
  PageFooter,
  PageHeader,
} from "@/components/pages/reports/pdf/contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "@/components/pages/reports/pdf/contract-report-pdf-styles";
import {
  formatReportPrice,
  formatSize,
  INDEX_COLUMNS,
  type AvailabilityIndexRow,
  type AvailabilityReportCopy,
} from "./availability-report-data";

const styles = StyleSheet.create({
  tableSection: {
    gap: px(12),
    marginTop: px(48),
  },
  continuationSection: {
    gap: px(12),
    paddingTop: px(72),
  },
  row: {
    flexDirection: "row",
  },
  th: {
    padding: px(12),
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
  },
  alignRight: {
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

const COLUMNS: { heading: string; style: Style; alignRight?: boolean }[] = [
  { heading: "Código", style: { width: px(INDEX_COLUMNS.code) } },
  { heading: "Ubicación", style: { flex: 1 } },
  { heading: "Medida", style: { width: px(INDEX_COLUMNS.size) } },
  { heading: "Canon mensual", style: { width: px(INDEX_COLUMNS.price) }, alignRight: true },
  { heading: "Pág.", style: { width: px(INDEX_COLUMNS.page) }, alignRight: true },
];

function cellStyle(column: number, base: Style): Style[] {
  const { style, alignRight } = COLUMNS[column]!;
  return [
    base,
    style,
    alignRight ? styles.alignRight : {},
    column === 0 ? styles.firstCell : {},
    column === COLUMNS.length - 1 ? styles.lastCell : {},
  ];
}

function AvailabilityTable({ rows }: { rows: AvailabilityIndexRow[] }) {
  return (
    <View>
      <View style={styles.row}>
        {COLUMNS.map(({ heading }, column) => (
          <View key={heading} style={cellStyle(column, styles.th)}>
            <Eyebrow>{heading}</Eyebrow>
          </View>
        ))}
      </View>
      {rows.map(({ billboard, pageNumber }) => (
        <View key={pageNumber} style={styles.row} wrap={false}>
          <View style={cellStyle(0, styles.td)}>
            <Text style={styles.code}>{billboard.code || "—"}</Text>
          </View>
          <View style={cellStyle(1, styles.td)}>
            <Text style={styles.address}>{billboard.address || "—"}</Text>
          </View>
          <View style={cellStyle(2, styles.td)}>
            <Text style={styles.cellText}>{formatSize(billboard.width, billboard.height)}</Text>
          </View>
          <View style={cellStyle(3, styles.td)}>
            <Text style={styles.cellText}>{formatReportPrice(billboard.price)}</Text>
          </View>
          <View style={cellStyle(4, styles.td)}>
            <Text style={styles.cellText}>{formatPageNumber(pageNumber)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function AvailabilityReportSummaryPage({
  copy,
  rows,
  pageNumber,
}: {
  copy: AvailabilityReportCopy;
  rows: AvailabilityIndexRow[];
  pageNumber: number;
}) {
  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label={`Disponibilidad · ${copy.headerDate}`} />

      <View style={s.intro}>
        <Eyebrow>Resumen</Eyebrow>
        <Text style={s.sectionTitle}>{copy.summaryTitle}</Text>
        <Text style={s.lead}>{copy.summaryLead}</Text>
      </View>

      <View style={styles.tableSection}>
        <Eyebrow>Vallas disponibles</Eyebrow>
        <AvailabilityTable rows={rows} />
      </View>

      <View style={s.spacer} />
      <PageFooter label={copy.footerLabel} pageNumber={pageNumber} />
    </Page>
  );
}

export function AvailabilityReportIndexPage({
  copy,
  rows,
  pageNumber,
}: {
  copy: AvailabilityReportCopy;
  rows: AvailabilityIndexRow[];
  pageNumber: number;
}) {
  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label={`Disponibilidad · ${copy.headerDate}`} />

      <View style={styles.continuationSection}>
        <Eyebrow>Vallas disponibles</Eyebrow>
        <AvailabilityTable rows={rows} />
      </View>

      <View style={s.spacer} />
      <PageFooter label={copy.footerLabel} pageNumber={pageNumber} />
    </Page>
  );
}
