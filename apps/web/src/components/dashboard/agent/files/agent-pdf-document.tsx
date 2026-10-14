import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { AgentPdfInput, AgentPdfSection } from "@/api/agent/agent.types";
import { formatHumanDayDate } from "@/lib/format";
import { registerBrandFonts } from "@/lib/pdf-brand-fonts";
import { AgentPdfChartBlock } from "./agent-pdf-chart";
import {
  AgentPdfFooter,
  AgentPdfHeader,
  AgentPdfHighlights,
  AgentPdfTitle,
} from "./agent-pdf-chrome";
import { pdfStyles } from "./agent-pdf-styles";
import { AgentPdfTableBlock } from "./agent-pdf-table";

registerBrandFonts();

function SectionBlock({ section }: { section: AgentPdfSection }) {
  return (
    <View style={pdfStyles.section}>
      {section.heading ? (
        <View style={pdfStyles.sectionHeading} minPresenceAhead={60}>
          <View style={pdfStyles.sectionMarker} />
          <Text style={pdfStyles.sectionTitle}>{section.heading}</Text>
        </View>
      ) : null}
      {section.paragraphs?.map((paragraph, i) => (
        <Text key={`p-${i}`} style={pdfStyles.paragraph}>
          {paragraph}
        </Text>
      ))}
      {section.bullets?.map((bullet, i) => (
        <View key={`b-${i}`} style={pdfStyles.bullet}>
          <View style={pdfStyles.bulletMark} />
          <Text style={pdfStyles.bulletText}>{bullet}</Text>
        </View>
      ))}
      {section.chart ? <AgentPdfChartBlock chart={section.chart} /> : null}
      {section.table ? <AgentPdfTableBlock table={section.table} /> : null}
    </View>
  );
}

export function AgentPdfDocument({ spec }: { spec: AgentPdfInput }) {
  const generatedAt = formatHumanDayDate(new Date());

  return (
    <Document title={spec.title} author="VEO" creator="Nexo · VEO Services">
      <Page
        size="A4"
        orientation={spec.orientation ?? "portrait"}
        style={pdfStyles.page}
        wrap
      >
        <AgentPdfHeader generatedAt={generatedAt} />
        <AgentPdfTitle title={spec.title} subtitle={spec.subtitle} />
        {spec.highlights?.length ? (
          <AgentPdfHighlights highlights={spec.highlights} />
        ) : null}
        {spec.sections.map((section, index) => (
          <SectionBlock key={index} section={section} />
        ))}
        <AgentPdfFooter />
      </Page>
    </Document>
  );
}
