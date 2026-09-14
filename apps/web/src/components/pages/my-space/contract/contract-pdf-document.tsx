import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { OfferContractData } from "@/api/offers/offers.types";
import {
  CONTRACT_FONT_FAMILY,
  registerContractFonts,
} from "@/lib/pdf-contract-fonts";
import {
  ACKNOWLEDGEMENT_PARAGRAPH,
  buildClauses,
  buildPartiesParagraph,
  formatLongDate,
  formatMoney,
  formatPaddedDate,
  formatShortDate,
  IVA_NOTE,
  LESSOR,
  type ContractRun,
} from "./contract-template";

registerContractFonts();

/**
 * Every measurement below is taken from the signed template (Letter, 612x792pt)
 * so the generated contract lays out like the original rather than merely
 * resembling it: 54pt side margins, an inner table block 468.1pt wide, 10.6pt
 * body text on a 14.73pt line, and 9pt table text on a 12.6pt line.
 */
const BODY_SIZE = 10.6;
const BODY_LINE = 1.39;
const TABLE_SIZE = 9;
const TABLE_LINE = 1.4;
const TABLE_WIDTH = 468.1;
const BORDER = 0.5;
const HEADER_FILL = "#E7E6E6";

/** Widths of the four-column summary block, left to right. */
const SUMMARY_COLS = [129.98, 104.07, 144.98, 89.07];

/** Widths of the billboard detail table: tipo, código, ubicación, medidas, costo, vigencia. */
const DETAIL_COLS = [54.98, 45, 165.03, 55.1, 57.96, 90.03];

const styles = StyleSheet.create({
  page: {
    fontFamily: CONTRACT_FONT_FAMILY,
    fontSize: BODY_SIZE,
    lineHeight: BODY_LINE,
    color: "#000000",
    paddingTop: 35.4,
    paddingBottom: 54,
    paddingLeft: 54,
    paddingRight: 54,
  },
  headerCompany: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
  },
  headerRule: {
    borderBottomWidth: 0.72,
    borderBottomColor: "#000000",
    marginBottom: 13.1,
  },
  dateline: {
    textAlign: "right",
  },
  contractNumber: {
    textAlign: "right",
    fontWeight: 700,
    marginTop: 3,
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 15.1,
  },
  paragraph: {
    textAlign: "justify",
    marginTop: 17.1,
  },
  table: {
    width: TABLE_WIDTH,
    borderTopWidth: BORDER,
    borderLeftWidth: BORDER,
    borderColor: "#000000",
    borderStyle: "solid",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    justifyContent: "center",
    borderRightWidth: BORDER,
    borderBottomWidth: BORDER,
    borderColor: "#000000",
    borderStyle: "solid",
    paddingLeft: 5.76,
    paddingRight: 5.76,
    // Symmetric so a one-line cell centres against a wrapping neighbour, the way
    // the template's vertically centred cells do.
    paddingTop: 4,
    paddingBottom: 4,
  },
  cellText: {
    fontSize: TABLE_SIZE,
    lineHeight: TABLE_LINE,
  },
  ivaNote: {
    fontSize: TABLE_SIZE,
    lineHeight: TABLE_LINE,
    fontStyle: "italic",
    marginTop: 10,
  },
  signatures: {
    flexDirection: "row",
    marginTop: 25,
  },
  signatureColumn: {
    width: 234.05,
  },
  signatureName: {
    marginTop: 8,
  },
  clause: {
    textAlign: "justify",
    marginTop: 11,
  },
});

/** Renders template runs inside one justified block so line breaks match Word. */
function Runs({ runs }: { runs: ContractRun[] }) {
  return (
    <>
      {runs.map((run, index) => (
        <Text key={index} style={run.bold ? { fontWeight: 700 } : undefined}>
          {run.text}
        </Text>
      ))}
    </>
  );
}

function ContractHeader() {
  return (
    <View fixed>
      <Text style={styles.headerCompany}>{LESSOR.companyName}</Text>
      <View style={styles.headerRule} />
    </View>
  );
}

function Cell({
  width,
  bold,
  children,
  fill,
}: {
  width: number;
  bold?: boolean;
  children: string;
  fill?: string;
}) {
  return (
    <View style={[styles.cell, { width }, fill ? { backgroundColor: fill } : {}]}>
      <Text style={[styles.cellText, bold ? { fontWeight: 700 } : {}]}>
        {children}
      </Text>
    </View>
  );
}

/** Label/value grid summarising quantity, money and the contract period. */
function SummaryTable({ data }: { data: OfferContractData }) {
  const rows: Array<[string, string, string, string]> = [
    [
      "CANTIDAD DE VALLAS:",
      String(data.billboardCount),
      "FECHA DE INICIO DE CONTRATO:",
      formatPaddedDate(data.startDate),
    ],
    [
      "VALOR DE ALQUILER MENSUAL:",
      formatMoney(data.monthlyRentalTotal),
      "FECHA DE FINALIZACIÓN DE CONTRATO:",
      formatPaddedDate(data.endDate),
    ],
    [
      "VALOR TOTAL DEL CONTRATO:",
      formatMoney(data.contractTotal),
      "PRODUCCIÓN:",
      "Ver cláusula III",
    ],
  ];

  return (
    <View style={styles.table}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((value, colIndex) => (
            <Cell
              key={colIndex}
              width={SUMMARY_COLS[colIndex]}
              // Columns 1 and 3 hold the labels; 2 and 4 hold their values.
              bold={colIndex % 2 === 0}
            >
              {value}
            </Cell>
          ))}
        </View>
      ))}
    </View>
  );
}

const DETAIL_HEADINGS = [
  "Tipo de Valla",
  "Código",
  "Ubicación",
  "Medidas",
  "Costo Unitario",
  "Vigencia",
];

function DetailTable({ data }: { data: OfferContractData }) {
  return (
    <View style={[styles.table, { marginTop: 25 }]}>
      <View style={styles.row}>
        {DETAIL_HEADINGS.map((heading, index) => (
          <Cell
            key={heading}
            width={DETAIL_COLS[index]}
            bold
            fill={HEADER_FILL}
          >
            {heading}
          </Cell>
        ))}
      </View>
      {data.billboards.map((billboard, index) => (
        <View key={`${billboard.code}-${index}`} style={styles.row} wrap={false}>
          <Cell width={DETAIL_COLS[0]}>{billboard.vallaType}</Cell>
          <Cell width={DETAIL_COLS[1]}>{billboard.code}</Cell>
          <Cell width={DETAIL_COLS[2]}>{billboard.location}</Cell>
          <Cell width={DETAIL_COLS[3]}>{billboard.dimensions}</Cell>
          <Cell width={DETAIL_COLS[4]}>{formatMoney(billboard.monthlyCost)}</Cell>
          <Cell width={DETAIL_COLS[5]}>
            {billboard.startDate && billboard.endDate
              ? `${formatShortDate(billboard.startDate)} al ${formatShortDate(billboard.endDate)}`
              : ""}
          </Cell>
        </View>
      ))}
    </View>
  );
}

function Signatures({ data }: { data: OfferContractData }) {
  const line = "_________________________________";
  return (
    <View style={styles.signatures}>
      <View style={styles.signatureColumn}>
        <Text>{line}</Text>
        <Text style={[styles.signatureName, { fontWeight: 700 }]}>
          Por: {LESSOR.companyName}
        </Text>
        <Text style={styles.signatureName}>{LESSOR.legalRepName}</Text>
      </View>
      <View style={styles.signatureColumn}>
        <Text>{line}</Text>
        <Text style={[styles.signatureName, { fontWeight: 700 }]}>
          Por: {data.client.legalRepName}
        </Text>
        <Text style={[styles.signatureName, { fontWeight: 700 }]}>
          {data.client.companyName}
        </Text>
      </View>
    </View>
  );
}

export interface ContractPdfDocumentProps {
  data: OfferContractData;
}

export function ContractPdfDocument({ data }: ContractPdfDocumentProps) {
  const clauses = buildClauses(data);

  return (
    <Document
      title={`Contrato ${data.contractNumber}`}
      author={LESSOR.companyName}
      subject={`Contrato de arrendamiento ${data.contractNumber}`}
    >
      <Page size="LETTER" style={styles.page}>
        <ContractHeader />

        <Text style={styles.dateline}>
          {LESSOR.city}, {formatLongDate(data.contractDate)}
        </Text>
        <Text style={styles.contractNumber}>{data.contractNumber}</Text>
        <Text style={styles.title}>CONTRATO DE ARRENDAMIENTO</Text>

        <Text style={[styles.paragraph, { marginBottom: 15 }]}>
          <Runs runs={buildPartiesParagraph(data)} />
        </Text>

        <SummaryTable data={data} />
        <DetailTable data={data} />

        <Text style={styles.ivaNote}>{IVA_NOTE}</Text>
        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          {ACKNOWLEDGEMENT_PARAGRAPH}
        </Text>

        <Signatures data={data} />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <ContractHeader />

        <Text style={[styles.title, { marginTop: 4.8, marginBottom: 6.1 }]}>
          CLÁUSULAS
        </Text>

        {clauses.map((clause) => (
          <Text key={clause.label} style={styles.clause}>
            <Text style={{ fontWeight: 700 }}>{clause.label}</Text>
            <Runs runs={clause.body} />
          </Text>
        ))}
      </Page>
    </Document>
  );
}
