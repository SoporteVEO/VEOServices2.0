import { Image, Text, View } from "@react-pdf/renderer";
import type { AgentPdfHighlight } from "@/api/agent/agent.types";
import { pdfStyles } from "./agent-pdf-styles";

const WORDMARK_SRC = "/VEO_Logotipo_Oscuro_Original.png";
const ISOTIPO_SRC = "/FAVICON_VEO_Isotipo_Lima.png";

/** The wordmark ships white on transparent, so it always sits on VEO Dark. */
export function AgentPdfHeader({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={pdfStyles.header} fixed>
      <Image src={WORDMARK_SRC} style={pdfStyles.headerLogo} />
      <Text style={pdfStyles.headerMeta}>
        {`NEXO · VEO SERVICES · ${generatedAt.toUpperCase()}`}
      </Text>
    </View>
  );
}

export function AgentPdfFooter() {
  return (
    <View style={pdfStyles.footer} fixed>
      <View style={pdfStyles.footerBrand}>
        <Image src={ISOTIPO_SRC} style={pdfStyles.footerIsotipo} />
        <Text style={pdfStyles.footerText}>Visible. Verificable. VEO.</Text>
      </View>
      <Text
        style={pdfStyles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

export function AgentPdfTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={pdfStyles.titleBlock}>
      <Text style={pdfStyles.eyebrow}>Reporte VEO</Text>
      <View style={pdfStyles.titleRow}>
        <Text style={pdfStyles.title}>{title}</Text>
        <View style={pdfStyles.titleDot} />
      </View>
      {subtitle ? <Text style={pdfStyles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function AgentPdfHighlights({
  highlights,
}: {
  highlights: AgentPdfHighlight[];
}) {
  return (
    <View style={pdfStyles.highlights} wrap={false}>
      {highlights.map((item, index) => {
        const featured = index === 0;
        return (
          <View
            key={`${item.label}-${index}`}
            style={[
              pdfStyles.highlight,
              featured ? pdfStyles.highlightFeatured : {},
            ]}
          >
            <Text
              style={[
                pdfStyles.highlightLabel,
                featured ? pdfStyles.highlightLabelFeatured : {},
              ]}
            >
              {item.label}
            </Text>
            <Text
              style={[
                pdfStyles.highlightValue,
                featured ? pdfStyles.highlightValueFeatured : {},
              ]}
            >
              {item.value}
            </Text>
            {item.detail ? (
              <Text
                style={[
                  pdfStyles.highlightDetail,
                  featured ? pdfStyles.highlightDetailFeatured : {},
                ]}
              >
                {item.detail}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
