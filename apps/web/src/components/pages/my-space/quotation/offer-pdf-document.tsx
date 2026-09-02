"use client";

import type { ReactNode } from "react";
import { Document, Font, Image, Page, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { Heading } from "@/components/pdfx/heading/pdfx-heading";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/pdfx/table/pdfx-table";
import { Text } from "@/components/pdfx/text/pdfx-text";
import { PdfxThemeProvider } from "@/lib/pdfx-theme-context";
import { formatHumanDateRange, formatHumanDayDate } from "@/lib/format";
import {
  computeOfferTotals,
  type DigitalOfferItem,
  type MiscOfferItem,
  type OfferItem,
  type OfferTotals,
  type StaticOfferItem,
} from "./offer-types";

// react-pdf hyphenates by default, which chops street names mid-word inside
// the narrow description column. Wrapping on whole words reads far better.
Font.registerHyphenationCallback((word) => [word]);

const PAGE_STYLE: Style = {
  paddingTop: 28,
  paddingBottom: 32,
  paddingHorizontal: 32,
};

/** Below this many rows a table is kept on one page instead of splitting. */
const NO_WRAP_ROW_LIMIT = 8;

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

const TOTALS_LABEL_W = "44%";
const TOTALS_VAL_W = "28%";

const ROW_DETAIL_COLOR = "#6b7280";

/**
 * Every items table reads left to right as código → descripción → montos →
 * total. Secondary facts (size, dates, address) live inside the description
 * cell so the numeric columns stay narrow and scannable.
 */
const STATIC_COL_W = {
  code: "10%",
  desc: "38%",
  qty: "8%",
  rental: "15%",
  print: "14%",
  total: "15%",
} as const;

const DIGITAL_COL_W = {
  code: "10%",
  desc: "41%",
  spots: "9%",
  qty: "8%",
  rental: "16%",
  total: "16%",
} as const;

const MISC_COL_W = {
  code: "10%",
  desc: "47%",
  qty: "8%",
  unit: "17%",
  total: "18%",
} as const;

function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$ ${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSize(width: number | null, height: number | null): string | null {
  if (width == null && height == null) return null;
  const w = width != null ? width.toFixed(2) : "—";
  const h = height != null ? height.toFixed(2) : "—";
  return `${w} × ${h} m`;
}

function durationDetail(
  startDate: Date | null,
  endDate: Date | null,
): string | null {
  if (!startDate && !endDate) return null;
  return formatHumanDateRange(startDate, endDate);
}

function joinDetails(parts: (string | null | undefined)[]): string | null {
  const kept = parts.filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  return kept.length > 0 ? kept.join(" · ") : null;
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
          {formatHumanDayDate(generatedAt)}
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

function ContactBlock({ data }: { data: OfferPdfData }) {
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
      <ContactField label="Correo cliente" value={data.customerEmail || "—"} />
      <ContactField
        label="Correo Facturacion"
        value={data.customerBillingEmail || "—"}
      />
      <ContactField label="Empresa" value={data.customerCompany || "—"} />
    </View>
  );
}

function HeaderCellLabel({
  children,
  align = "center",
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <Text
      variant="xs"
      weight="bold"
      color="#ffffff"
      noMargin
      // Smaller than the body so long labels like ARRENDAMIENTO fit on one
      // line inside a narrow money column instead of hyphenating.
      style={{ textAlign: align, fontSize: 7, letterSpacing: 0.4 }}
    >
      {children}
    </Text>
  );
}

/**
 * Keeps a section heading glued to its table: react-pdf will push the whole
 * block to the next page rather than stranding the title at the bottom.
 */
function ItemsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: 4 }} minPresenceAhead={90}>
      <SectionTitle title={title} />
      {children}
    </View>
  );
}

/**
 * Two-line description cell: the headline the reader scans for, plus a muted
 * detail line carrying the facts that used to need their own columns.
 */
function DescriptionCell({
  title,
  detail,
}: {
  title: string;
  detail?: string | null;
}) {
  return (
    <View>
      <Text variant="xs" weight="medium" color={FOOTER_TEXT} noMargin>
        {title}
      </Text>
      {detail ? (
        <Text
          variant="xs"
          color={ROW_DETAIL_COLOR}
          noMargin
          style={{ marginTop: 1 }}
        >
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

function TotalRowFooter({
  label,
  amount,
  width,
  spanBefore,
}: {
  label: string;
  amount: number;
  width: string;
  spanBefore: string;
}) {
  return (
    <TableRow footer variant="compact">
      <TableCell width={spanBefore} align="right">
        <Text variant="xs" weight="bold" color={FOOTER_TEXT} noMargin>
          {label}
        </Text>
      </TableCell>
      <TableCell width={width} align="right">
        <Text variant="xs" weight="bold" color={BRAND_PRIMARY} noMargin>
          {formatCurrency(amount)}
        </Text>
      </TableCell>
    </TableRow>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      variant="xs"
      weight="bold"
      color={BRAND_PRIMARY}
      transform="uppercase"
      noMargin
      style={{ marginTop: 8, marginBottom: 4 }}
    >
      {title}
    </Text>
  );
}

function StaticItemsTable({ items }: { items: StaticOfferItem[] }) {
  if (items.length === 0) return null;

  const total = items.reduce(
    (sum, item) => sum + (item.rentalPrice + item.impressionPrice) * item.quantity,
    0,
  );

  return (
    <ItemsSection title="VALLAS ESTÁTICAS">
      <Table
        variant="compact"
        zebraStripe
        noWrap={items.length <= NO_WRAP_ROW_LIMIT}
      >
        <TableHeader>
          <TableRow header variant="compact" style={{ backgroundColor: BRAND_PRIMARY }}>
            <TableCell header width={STATIC_COL_W.code} align="center">
              <HeaderCellLabel>CÓDIGO</HeaderCellLabel>
            </TableCell>
            <TableCell header width={STATIC_COL_W.desc} align="left">
              <HeaderCellLabel align="left">DESCRIPCIÓN</HeaderCellLabel>
            </TableCell>
            <TableCell header width={STATIC_COL_W.qty} align="center">
              <HeaderCellLabel>CANT.</HeaderCellLabel>
            </TableCell>
            <TableCell header width={STATIC_COL_W.rental} align="right">
              <HeaderCellLabel align="right">ARRENDAMIENTO</HeaderCellLabel>
            </TableCell>
            <TableCell header width={STATIC_COL_W.print} align="right">
              <HeaderCellLabel align="right">IMPRESIÓN</HeaderCellLabel>
            </TableCell>
            <TableCell header width={STATIC_COL_W.total} align="right">
              <HeaderCellLabel align="right">TOTAL</HeaderCellLabel>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} variant="compact">
              <TableCell width={STATIC_COL_W.code} align="center">
                {item.billboardCode || "—"}
              </TableCell>
              <TableCell width={STATIC_COL_W.desc}>
                <DescriptionCell
                  title={item.description || "Valla estática"}
                  detail={joinDetails([
                    formatSize(item.width, item.height),
                    durationDetail(item.startDate, item.endDate),
                  ])}
                />
              </TableCell>
              <TableCell width={STATIC_COL_W.qty} align="center">
                {String(item.quantity)}
              </TableCell>
              <TableCell width={STATIC_COL_W.rental} align="right">
                {formatCurrency(item.rentalPrice)}
              </TableCell>
              <TableCell width={STATIC_COL_W.print} align="right">
                {formatCurrency(item.impressionPrice)}
              </TableCell>
              <TableCell width={STATIC_COL_W.total} align="right">
                {formatCurrency(
                  (item.rentalPrice + item.impressionPrice) * item.quantity,
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TotalRowFooter
            label="Subtotal vallas estáticas"
            amount={total}
            spanBefore="85%"
            width={STATIC_COL_W.total}
          />
        </TableFooter>
      </Table>
    </ItemsSection>
  );
}

function DigitalItemsTable({ items }: { items: DigitalOfferItem[] }) {
  if (items.length === 0) return null;

  const total = items.reduce(
    (sum, item) => sum + item.rentalPrice * item.quantity,
    0,
  );

  return (
    <ItemsSection title="VALLAS DIGITALES">
      <Table
        variant="compact"
        zebraStripe
        noWrap={items.length <= NO_WRAP_ROW_LIMIT}
      >
        <TableHeader>
          <TableRow header variant="compact" style={{ backgroundColor: BRAND_PRIMARY }}>
            <TableCell header width={DIGITAL_COL_W.code} align="center">
              <HeaderCellLabel>CÓDIGO</HeaderCellLabel>
            </TableCell>
            <TableCell header width={DIGITAL_COL_W.desc} align="left">
              <HeaderCellLabel align="left">DESCRIPCIÓN</HeaderCellLabel>
            </TableCell>
            <TableCell header width={DIGITAL_COL_W.spots} align="center">
              <HeaderCellLabel>SPOTS/DÍA</HeaderCellLabel>
            </TableCell>
            <TableCell header width={DIGITAL_COL_W.qty} align="center">
              <HeaderCellLabel>CANT.</HeaderCellLabel>
            </TableCell>
            <TableCell header width={DIGITAL_COL_W.rental} align="right">
              <HeaderCellLabel align="right">ARRENDAMIENTO</HeaderCellLabel>
            </TableCell>
            <TableCell header width={DIGITAL_COL_W.total} align="right">
              <HeaderCellLabel align="right">TOTAL</HeaderCellLabel>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} variant="compact">
              <TableCell width={DIGITAL_COL_W.code} align="center">
                {item.billboardCode || "—"}
              </TableCell>
              <TableCell width={DIGITAL_COL_W.desc}>
                <DescriptionCell
                  title={item.name}
                  detail={joinDetails([
                    item.address,
                    durationDetail(item.startDate, item.endDate),
                  ])}
                />
              </TableCell>
              <TableCell width={DIGITAL_COL_W.spots} align="center">
                {String(item.spotCount)}
              </TableCell>
              <TableCell width={DIGITAL_COL_W.qty} align="center">
                {String(item.quantity)}
              </TableCell>
              <TableCell width={DIGITAL_COL_W.rental} align="right">
                {formatCurrency(item.rentalPrice)}
              </TableCell>
              <TableCell width={DIGITAL_COL_W.total} align="right">
                {formatCurrency(item.rentalPrice * item.quantity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TotalRowFooter
            label="Subtotal vallas digitales"
            amount={total}
            spanBefore="84%"
            width={DIGITAL_COL_W.total}
          />
        </TableFooter>
      </Table>
    </ItemsSection>
  );
}

function MiscItemsTable({ items }: { items: MiscOfferItem[] }) {
  if (items.length === 0) return null;

  const total = items.reduce(
    (sum, item) => sum + item.rentalPrice * item.quantity,
    0,
  );

  return (
    <ItemsSection title="OTROS CONCEPTOS">
      <Table
        variant="compact"
        zebraStripe
        noWrap={items.length <= NO_WRAP_ROW_LIMIT}
      >
        <TableHeader>
          <TableRow header variant="compact" style={{ backgroundColor: BRAND_PRIMARY }}>
            <TableCell header width={MISC_COL_W.code} align="center">
              <HeaderCellLabel>CÓDIGO</HeaderCellLabel>
            </TableCell>
            <TableCell header width={MISC_COL_W.desc} align="left">
              <HeaderCellLabel align="left">DESCRIPCIÓN</HeaderCellLabel>
            </TableCell>
            <TableCell header width={MISC_COL_W.qty} align="center">
              <HeaderCellLabel>CANT.</HeaderCellLabel>
            </TableCell>
            <TableCell header width={MISC_COL_W.unit} align="right">
              <HeaderCellLabel align="right">PRECIO</HeaderCellLabel>
            </TableCell>
            <TableCell header width={MISC_COL_W.total} align="right">
              <HeaderCellLabel align="right">TOTAL</HeaderCellLabel>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id} variant="compact">
              <TableCell width={MISC_COL_W.code} align="center">
                {`C-${String(index + 1).padStart(2, "0")}`}
              </TableCell>
              <TableCell width={MISC_COL_W.desc}>
                <DescriptionCell
                  title={item.description || "Concepto adicional"}
                  detail={durationDetail(item.startDate, item.endDate)}
                />
              </TableCell>
              <TableCell width={MISC_COL_W.qty} align="center">
                {String(item.quantity)}
              </TableCell>
              <TableCell width={MISC_COL_W.unit} align="right">
                {formatCurrency(item.unitPrice)}
              </TableCell>
              <TableCell width={MISC_COL_W.total} align="right">
                {formatCurrency(item.rentalPrice * item.quantity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TotalRowFooter
            label="Subtotal otros conceptos"
            amount={total}
            spanBefore="82%"
            width={MISC_COL_W.total}
          />
        </TableFooter>
      </Table>
    </ItemsSection>
  );
}

function TotalsBlock({ totals }: { totals: OfferTotals }) {
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
          label="IVA:"
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

function ConditionsBlock({ data }: { data: OfferPdfData }) {
  return (
    <View style={{ marginTop: 14, gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="xs" weight="bold" color={BRAND_PRIMARY} noMargin>
            VIGENCIA OFERTA:
          </Text>
          <Text variant="sm" color={FOOTER_TEXT} noMargin>
            {formatHumanDayDate(data.validUntil)}
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

export interface OfferPdfData {
  offerNumber: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerBillingEmail: string;
  customerContact: string;
  validUntil: Date;
  specialConditions: string;
  advisorFullName: string | null;
  items: OfferItem[];
  /**
   * Date printed on the document. Regenerating an existing offer passes its
   * issue date so the PDF does not appear to change every time it is opened.
   */
  generatedAt?: Date;
}

export interface OfferPdfDocumentProps {
  data: OfferPdfData;
  logoSrc: string;
}

export function OfferPdfDocument({ data, logoSrc }: OfferPdfDocumentProps) {
  const totals = computeOfferTotals(data.items);
  const generatedAt = data.generatedAt ?? new Date();

  const staticItems = data.items.filter(
    (item): item is StaticOfferItem => item.type === "STATIC_BILLBOARD",
  );
  const digitalItems = data.items.filter(
    (item): item is DigitalOfferItem => item.type === "DIGITAL_BILLBOARD",
  );
  const miscItems = data.items.filter(
    (item): item is MiscOfferItem => item.type === "MISC",
  );

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

          <StaticItemsTable items={staticItems} />
          <DigitalItemsTable items={digitalItems} />
          <MiscItemsTable items={miscItems} />

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
