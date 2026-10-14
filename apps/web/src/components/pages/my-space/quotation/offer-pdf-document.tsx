"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatHumanDayDate } from "@/lib/format";
import { registerDocumentFonts } from "@/lib/pdf-document-fonts";
import {
  DocFooter,
  DocHeader,
  DocInfoCell,
  DocSignatures,
  DocTitle,
} from "../document/veo-document-parts";
import { DOC_COLORS, docStyles as d } from "../document/veo-document-styles";
import {
  buildIntroSentence,
  CONDITIONS_TAGLINE,
  LESSOR_ADDRESS,
  OFFER_TAGLINE,
  PAYMENT_TERMS,
} from "./offer-pdf-copy";
import {
  DigitalItemsSection,
  MiscItemsSection,
  StaticItemsSection,
  TotalsBlock,
} from "./offer-pdf-items";
import { offerStyles as s } from "./offer-pdf-styles";
import {
  computeOfferTotals,
  type DigitalOfferItem,
  type MiscOfferItem,
  type OfferItem,
  type StaticOfferItem,
} from "./offer-types";

registerDocumentFonts();

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
}

function orDash(value: string) {
  return value.trim() || "—";
}

function CustomerGrid({ data }: { data: OfferPdfData }) {
  return (
    <View style={d.infoGrid} wrap={false}>
      <View style={d.infoRow}>
        <DocInfoCell
          label="EMPRESA:"
          value={orDash(data.customerCompany)}
          valueStyle={s.infoValue}
        />
        <DocInfoCell
          label="NOMBRE:"
          value={orDash(data.customerName)}
          valueStyle={s.infoValue}
        />
        <DocInfoCell
          label="CONTACTO:"
          value={orDash(data.customerContact)}
          valueStyle={s.infoValue}
        />
      </View>
      <View style={d.infoRow}>
        <DocInfoCell
          label="CORREO CLIENTE:"
          value={orDash(data.customerEmail)}
          valueStyle={s.infoValueText}
          width="33.333%"
        />
        <DocInfoCell
          label="CORREO DE FACTURACIÓN:"
          value={orDash(data.customerBillingEmail)}
          valueStyle={s.infoValueText}
          width="66.667%"
        />
      </View>
    </View>
  );
}

function ConditionsGrid({ data }: { data: OfferPdfData }) {
  return (
    <View style={d.infoGrid} wrap={false}>
      <View style={d.infoRow}>
        <DocInfoCell
          label="VIGENCIA DE LA OFERTA:"
          value={formatHumanDayDate(data.validUntil)}
          valueStyle={s.infoValueLarge}
        />
        <DocInfoCell
          label="CONDICIONES ESPECIALES:"
          value={data.specialConditions.trim() || "Ninguna"}
          valueStyle={s.infoValueLarge}
        />
      </View>
    </View>
  );
}

export function OfferPdfDocument({ data }: OfferPdfDocumentProps) {
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
    <Document
      title={`Cotización ${data.offerNumber}`}
      author="VEO Media"
      creator="VEO Media"
    >
      <Page size="LETTER" style={d.page}>
        <DocHeader meta={formatHumanDayDate(generatedAt)} />
        <DocTitle title="COTIZACIÓN" badge={data.offerNumber} />

        <Text style={s.intro}>{buildIntroSentence(data.items)}</Text>
        <Text style={s.tagline}>{OFFER_TAGLINE}</Text>

        <CustomerGrid data={data} />

        <StaticItemsSection items={staticItems} />
        <DigitalItemsSection items={digitalItems} />
        <MiscItemsSection items={miscItems} />

        <TotalsBlock totals={totals} />
        <DocFooter dotColor={DOC_COLORS.ink} />
      </Page>

      <Page size="LETTER" style={d.page}>
        <DocHeader meta={data.offerNumber} />
        <Text style={d.pageTitle}>CONDICIONES</Text>

        <ConditionsGrid data={data} />

        <View style={s.paymentBox}>
          <Text style={d.infoLabel}>FORMA DE PAGO:</Text>
          <Text style={s.paymentText}>{PAYMENT_TERMS}</Text>
        </View>

        <Text style={s.closingTagline}>{CONDITIONS_TAGLINE}</Text>

        <View style={d.spacer} />
        <DocSignatures
          signers={[
            {
              label: "Asesor de cuenta",
              name: data.advisorFullName?.trim() || "—",
            },
            {
              label: "Aprobación del cliente",
              name: orDash(data.customerCompany || data.customerName),
            },
          ]}
        />
        <DocFooter dotColor={DOC_COLORS.lime} note={LESSOR_ADDRESS} />
      </Page>
    </Document>
  );
}
