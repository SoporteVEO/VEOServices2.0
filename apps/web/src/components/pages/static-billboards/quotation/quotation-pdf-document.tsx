"use client";

import type { ReactNode } from "react";
import { Document, Image, Page, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { Heading } from "@/components/pdfx/heading/pdfx-heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/pdfx/table/pdfx-table";
import { Text } from "@/components/pdfx/text/pdfx-text";
import { PdfxThemeProvider } from "@/lib/pdfx-theme-context";
import { formatDate, formatHumanDate } from "@/lib/format";
import type { QuotationData, QuotationTotals } from "./quotation-types";
import { computeQuotationTotals } from "./quotation-types";

const PAGE_STYLE: Style = {
  paddingTop: 28,
  paddingBottom: 32,
  paddingHorizontal: 32,
};

/**
 * Page 2 uses a flex column with the signatures pinned to the bottom so the
 * "Términos y Condiciones" block and the signatures don't crowd together at
 * the top of the page.
 */
const PAGE_STYLE_FLEX: Style = {
  ...PAGE_STYLE,
  flexDirection: "column",
};

const BRAND_PRIMARY = "#0bbac8";
const BRAND_PINK = "#e3326b";
const BRAND_GREEN = "#a8cf3a";
const HEADER_BG = "#f3f4f6";
const FOOTER_TEXT = "#374151";
const LABEL_COLOR = "#6b7280";

const COL_WIDTHS = {
  rental: "14%",
  size: "11%",
  print: "12%",
  code: "11%",
  qty: "8%",
  duration: "18%",
  desc: "26%",
} as const;

const TOTALS_LABEL_W = "44%";
const TOTALS_VAL_W = "28%";

function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$ ${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSize(width: number | null, height: number | null): string {
  if (width == null && height == null) return "—";
  const w = width != null ? width.toFixed(2) : "—";
  const h = height != null ? height.toFixed(2) : "—";
  return `${w} X ${h}`;
}

function formatItemDuration(
  startDate: Date | null,
  endDate: Date | null,
): string {
  if (!startDate && !endDate) return "—";
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function MetaTopRow({
  generatedAt,
  offerNumber,
  logoSrc,
}: {
  generatedAt: Date;
  offerNumber: string;
  logoSrc: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <View style={{ width: 110 }}>
        <Image src={logoSrc} style={{ width: 110, objectFit: "contain" }} />
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text variant="sm" color={FOOTER_TEXT} noMargin>
          {formatHumanDate(generatedAt)}
        </Text>
        <Text variant="sm" weight="bold" color={BRAND_PINK} noMargin>
          {offerNumber}
        </Text>
      </View>
    </View>
  );
}

function IntroSection() {
  return (
    <View style={{ marginBottom: 10 }}>
      <Heading level={2} align="center" noMargin color={BRAND_PRIMARY}>
        COTIZACIÓN
      </Heading>
      <View
        style={{
          height: 3,
          width: 90,
          marginHorizontal: "auto",
          backgroundColor: BRAND_GREEN,
          marginTop: 4,
          marginBottom: 10,
          borderRadius: 2,
        }}
      />
      <Text variant="sm" align="center" color={FOOTER_TEXT} noMargin>
        En VEO, Potenciamos marcas, ideas y proyectos que triunfan. Gracias por
        confiar en nosotros. De acuerdo a su solicitud hemos preparado una
        propuesta adecuada a sus necesidades.
      </Text>
      <Text
        variant="sm"
        align="center"
        weight="semibold"
        color={BRAND_PINK}
        style={{ marginTop: 4 }}
      >
        ¡Queremos que tu marca Impacte en GRANDE!
      </Text>
    </View>
  );
}

function ContactField({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 3,
        borderBottomWidth: 0.6,
        borderBottomColor: "#d1d5db",
      }}
    >
      <View style={{ width: "28%" }}>
        <Text
          variant="xs"
          color={LABEL_COLOR}
          transform="uppercase"
          weight="semibold"
          noMargin
        >
          {label}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="sm" color={FOOTER_TEXT} weight="medium" noMargin>
          {value || " "}
        </Text>
      </View>
    </View>
  );
}

function ContactBlock({ data }: { data: QuotationData }) {
  return (
    <View
      style={{
        marginTop: 4,
        marginBottom: 10,
        padding: 10,
        backgroundColor: HEADER_BG,
        borderRadius: 4,
      }}
    >
      <Text
        variant="sm"
        weight="bold"
        color={BRAND_PRIMARY}
        noMargin
        style={{ marginBottom: 6 }}
      >
        {(data.customerCompany || data.customerName).toUpperCase()}
      </Text>
      <ContactField label="Contacto" value={data.customerContact || "—"} />
      <ContactField label="Nombre" value={data.customerName || "—"} />
      <ContactField
        label="Correo Electrónico"
        value={data.customerEmail || "—"}
      />
      <ContactField label="Empresa" value={data.customerCompany || "—"} />
    </View>
  );
}

function HeaderCellLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      variant="xs"
      weight="bold"
      color="#ffffff"
      noMargin
      style={{ textAlign: "center" }}
    >
      {children}
    </Text>
  );
}

function HeaderRow() {
  return (
    <TableRow header variant="compact" style={{ backgroundColor: BRAND_PRIMARY }}>
      <TableCell header width={COL_WIDTHS.rental} align="center">
        <HeaderCellLabel>PRECIO DE{"\n"}ARRENDAMIENTO</HeaderCellLabel>
      </TableCell>
      <TableCell header width={COL_WIDTHS.size} align="center">
        <HeaderCellLabel>MEDIDA</HeaderCellLabel>
      </TableCell>
      <TableCell header width={COL_WIDTHS.print} align="center">
        <HeaderCellLabel>IMPRESIÓN</HeaderCellLabel>
      </TableCell>
      <TableCell header width={COL_WIDTHS.code} align="center">
        <HeaderCellLabel>CODIGO</HeaderCellLabel>
      </TableCell>
      <TableCell header width={COL_WIDTHS.qty} align="center">
        <HeaderCellLabel>CANT.</HeaderCellLabel>
      </TableCell>
      <TableCell header width={COL_WIDTHS.duration} align="center">
        <HeaderCellLabel>DURACIÓN</HeaderCellLabel>
      </TableCell>
      <TableCell header width={COL_WIDTHS.desc} align="center">
        <HeaderCellLabel>DESCRIPCIÓN</HeaderCellLabel>
      </TableCell>
    </TableRow>
  );
}

function TotalsBlock({ totals }: { totals: QuotationTotals }) {
  return (
    <View style={{ marginTop: 8, alignItems: "flex-end" }}>
      <View style={{ width: "65%" }}>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: HEADER_BG,
            paddingVertical: 3,
            paddingHorizontal: 6,
            marginBottom: 1,
          }}
        >
          <View style={{ width: TOTALS_LABEL_W }} />
          <View style={{ width: TOTALS_VAL_W, alignItems: "center" }}>
            <Text variant="xs" weight="bold" color={FOOTER_TEXT} noMargin>
              IMPRESIÓN
            </Text>
          </View>
          <View style={{ width: TOTALS_VAL_W, alignItems: "center" }}>
            <Text variant="xs" weight="bold" color={FOOTER_TEXT} noMargin>
              ARRENDAMIENTO
            </Text>
          </View>
        </View>

        <TotalsRow
          label="SUB TOTAL:"
          left={totals.subtotalImpression}
          right={totals.subtotalRental}
        />
        <TotalsRow
          label="IVA (13%):"
          left={totals.ivaImpression}
          right={totals.ivaRental}
        />
        <TotalsRow
          label="TOTAL:"
          left={totals.totalImpression}
          right={totals.totalRental}
          highlight
        />
      </View>
    </View>
  );
}

function TotalsRow({
  label,
  left,
  right,
  highlight,
}: {
  label: string;
  left: number;
  right: number;
  highlight?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 3,
        paddingHorizontal: 6,
        backgroundColor: highlight ? BRAND_PRIMARY : undefined,
        borderBottomWidth: highlight ? 0 : 0.5,
        borderBottomColor: "#e5e7eb",
      }}
    >
      <View style={{ width: TOTALS_LABEL_W, justifyContent: "center" }}>
        <Text
          variant="xs"
          weight={highlight ? "bold" : "semibold"}
          color={highlight ? "#ffffff" : FOOTER_TEXT}
          align="right"
          noMargin
        >
          {label}
        </Text>
      </View>
      <View style={{ width: TOTALS_VAL_W, alignItems: "center" }}>
        <Text
          variant="xs"
          weight={highlight ? "bold" : "medium"}
          color={highlight ? "#ffffff" : FOOTER_TEXT}
          noMargin
        >
          {formatCurrency(left)}
        </Text>
      </View>
      <View style={{ width: TOTALS_VAL_W, alignItems: "center" }}>
        <Text
          variant="xs"
          weight={highlight ? "bold" : "medium"}
          color={highlight ? "#ffffff" : FOOTER_TEXT}
          noMargin
        >
          {formatCurrency(right)}
        </Text>
      </View>
    </View>
  );
}

function ConditionsBlock({ data }: { data: QuotationData }) {
  return (
    <View style={{ marginTop: 14, gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="xs" weight="bold" color={BRAND_PRIMARY} noMargin>
            VIGENCIA OFERTA:
          </Text>
          <Text variant="sm" color={FOOTER_TEXT} noMargin>
            {formatHumanDate(data.validUntil)}
          </Text>
        </View>
        <View style={{ flex: 2 }}>
          <Text variant="xs" weight="bold" color={BRAND_PRIMARY} noMargin>
            CONDICIONES ESPECIALES:
          </Text>
          <Text variant="sm" color={FOOTER_TEXT} noMargin>
            {data.specialConditions?.trim() || "—"}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 4,
          padding: 8,
          backgroundColor: HEADER_BG,
          borderRadius: 4,
        }}
      >
        <Text variant="xs" weight="bold" color={FOOTER_TEXT} noMargin>
          Términos y Condiciones:
        </Text>
        <Text variant="xs" color={FOOTER_TEXT} noMargin>
          Cheque ó Transferencia a Nombre de: ARHEDES S.A de C.V
        </Text>
      </View>
    </View>
  );
}

function Signatures({ advisorFullName }: { advisorFullName: string | null }) {
  return (
    <View
      style={{
        marginBottom: 36,
        flexDirection: "row",
        gap: 32,
      }}
    >
      <View style={{ flex: 1, alignItems: "center" }}>
        <View
          style={{
            borderTopWidth: 0.8,
            borderTopColor: FOOTER_TEXT,
            width: "100%",
            paddingTop: 4,
            alignItems: "center",
          }}
        >
          <Text variant="sm" color={FOOTER_TEXT} weight="semibold" noMargin>
            {advisorFullName?.trim() || "—"}
          </Text>
          <Text variant="xs" color={LABEL_COLOR} noMargin>
            Asesor de Cuenta
          </Text>
        </View>
      </View>
      <View style={{ flex: 1, alignItems: "center" }}>
        <View
          style={{
            borderTopWidth: 0.8,
            borderTopColor: FOOTER_TEXT,
            width: "100%",
            paddingTop: 4,
            alignItems: "center",
          }}
        >
          <Text variant="sm" color={FOOTER_TEXT} weight="semibold" noMargin>
            {" "}
          </Text>
          <Text variant="xs" color={LABEL_COLOR} noMargin>
            Aprobación Cliente
          </Text>
        </View>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 14,
        left: 32,
        right: 32,
        borderTopWidth: 0.8,
        borderTopColor: BRAND_PRIMARY,
        paddingTop: 4,
        alignItems: "center",
      }}
    >
      <Text variant="xs" weight="bold" color={BRAND_PINK} noMargin>
        ARHEDES S.A de C.V
      </Text>
      <Text variant="xs" color={LABEL_COLOR} noMargin>
        AV. VICTOR MANUEL LARA BLOCK 4 A, COL. CAMPESTRE, # 9, SAN SALVADOR,
        SAN SALVADOR · 2528-7400
      </Text>
    </View>
  );
}

export interface QuotationPdfDocumentProps {
  data: QuotationData;
  logoSrc: string;
}

export function QuotationPdfDocument({
  data,
  logoSrc,
}: QuotationPdfDocumentProps) {
  const totals = computeQuotationTotals(data.items);
  const generatedAt = new Date();

  return (
    <PdfxThemeProvider>
      <Document
        title={`Cotización ${data.offerNumber}`}
        author="VEO Media"
        creator="VEO Media"
      >
        <Page size="A4" style={PAGE_STYLE}>
          <MetaTopRow
            generatedAt={generatedAt}
            offerNumber={data.offerNumber}
            logoSrc={logoSrc}
          />
          <IntroSection />
          <ContactBlock data={data} />

          <Table variant="compact" zebraStripe>
            <TableHeader>
              <HeaderRow />
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id} variant="compact">
                  <TableCell width={COL_WIDTHS.rental} align="right">
                    {formatCurrency(item.rentalPrice)}
                  </TableCell>
                  <TableCell width={COL_WIDTHS.size} align="center">
                    {formatSize(item.width, item.height)}
                  </TableCell>
                  <TableCell width={COL_WIDTHS.print} align="right">
                    {formatCurrency(item.impressionPrice)}
                  </TableCell>
                  <TableCell width={COL_WIDTHS.code} align="center">
                    {item.billboardCode || "—"}
                  </TableCell>
                  <TableCell width={COL_WIDTHS.qty} align="center">
                    {String(item.quantity)}
                  </TableCell>
                  <TableCell width={COL_WIDTHS.duration} align="center">
                    {formatItemDuration(item.startDate, item.endDate)}
                  </TableCell>
                  <TableCell width={COL_WIDTHS.desc}>
                    {item.description || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TotalsBlock totals={totals} />
          <Footer />
        </Page>

        <Page size="A4" style={PAGE_STYLE_FLEX}>
          <MetaTopRow
            generatedAt={generatedAt}
            offerNumber={data.offerNumber}
            logoSrc={logoSrc}
          />
          <ConditionsBlock data={data} />
          <View style={{ flexGrow: 1, minHeight: 40 }} />
          <Signatures advisorFullName={data.advisorFullName} />
          <Footer />
        </Page>
      </Document>
    </PdfxThemeProvider>
  );
}
