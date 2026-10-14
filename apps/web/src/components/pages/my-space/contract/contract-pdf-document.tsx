import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { OfferContractData } from "@/api/offers/offers.types";
import { registerDocumentFonts } from "@/lib/pdf-document-fonts";
import {
  DocFooter,
  DocHeader,
  DocSignatures,
  DocTitle,
} from "../document/veo-document-parts";
import { DOC_COLORS, docStyles as d } from "../document/veo-document-styles";
import {
  ACKNOWLEDGEMENT_PARAGRAPH,
  buildClauses,
  buildIvaNote,
  buildPartiesParagraph,
  formatLongDate,
  LESSOR,
} from "./contract-template";
import {
  ContractClauses,
  ContractDetailTable,
  ContractSummary,
  runsToText,
} from "./contract-pdf-parts";
import { contractStyles as s } from "./contract-pdf-styles";

registerDocumentFonts();

export interface ContractPdfDocumentProps {
  data: OfferContractData;
}

export function ContractPdfDocument({ data }: ContractPdfDocumentProps) {
  const clientSigner = data.client.legalRepName
    ? `Por: ${data.client.legalRepName}`
    : "Por:";

  return (
    <Document
      title={`Contrato ${data.contractNumber}`}
      author={LESSOR.companyName}
      subject={`Contrato de arrendamiento ${data.contractNumber}`}
    >
      <Page size="LETTER" style={d.page}>
        <DocHeader
          meta={`${LESSOR.city}, ${formatLongDate(data.contractDate)}`}
        />
        <DocTitle
          title={"CONTRATO DE\nARRENDAMIENTO"}
          badge={data.contractNumber}
        />

        <Text style={s.parties}>
          {runsToText(buildPartiesParagraph(data))}
        </Text>

        <ContractSummary data={data} />
        <ContractDetailTable data={data} />

        <Text style={s.ivaNote}>{buildIvaNote(data)}</Text>
        <Text style={s.acknowledgement}>{ACKNOWLEDGEMENT_PARAGRAPH}</Text>

        <View style={d.spacer} />
        <DocSignatures
          signers={[
            {
              label: `Por: ${LESSOR.companyName}`,
              name: LESSOR.legalRepName,
            },
            { label: clientSigner, name: data.client.companyName },
          ]}
        />
        <DocFooter dotColor={DOC_COLORS.ink} />
      </Page>

      <Page size="LETTER" style={d.page}>
        <DocHeader />
        <Text style={d.pageTitle}>CLÁUSULAS</Text>
        <ContractClauses clauses={buildClauses(data)} />
        <DocFooter dotColor={DOC_COLORS.lime} />
      </Page>
    </Document>
  );
}
