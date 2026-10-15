import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  EXPERIENCE_HIGHLIGHT,
  EXPERIENCE_STATS,
  REPORT_ASSETS,
  REPORT_BENEFITS,
  REPORT_FORMATS,
} from "./contract-report-pdf-content";
import {
  Eyebrow,
  Logo,
  PageFooter,
  PageHeader,
  SectionIntro,
  StatTile,
} from "./contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "./contract-report-pdf-styles";

const styles = StyleSheet.create({
  tiles: {
    flexGrow: 1,
    justifyContent: "flex-end",
    gap: px(12),
    marginTop: px(24),
  },
  tileRow: {
    flexDirection: "row",
    gap: px(12),
  },
  highlightRow: {
    flexGrow: 1,
    maxHeight: px(216),
  },
  list: {
    borderTopWidth: px(1),
    borderTopColor: REPORT_COLORS.dark,
  },
  formatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(24),
    paddingVertical: px(12),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray20,
  },
  formatIconCell: {
    width: px(60),
  },
  formatIcon: {
    width: px(48),
    height: px(48),
    objectFit: "contain",
  },
  formatName: {
    ...displayText(24, 1.1),
    flex: 1,
  },
  formatSize: {
    fontWeight: 400,
    fontSize: px(16),
    lineHeight: 1.4,
    color: REPORT_COLORS.gray,
  },
  benefitRow: {
    flexDirection: "row",
    gap: px(24),
    paddingVertical: px(18),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray40,
  },
  benefitNumber: {
    ...displayText(18, 1),
    letterSpacing: 0,
    width: px(60),
    /** react-pdf ignores `alignItems: baseline`; this lines the number up with the text's first line. */
    marginTop: px(8.85),
    color: REPORT_COLORS.gray,
  },
  benefitText: {
    flex: 1,
    fontWeight: 300,
    fontSize: px(24),
    lineHeight: 1.3,
  },
  closingHero: {
    flex: 1,
    justifyContent: "center",
    gap: px(36),
  },
  closingTagline: {
    ...displayText(48, 1.1),
    color: REPORT_COLORS.white,
  },
  closingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: px(24),
    borderTopWidth: px(1),
    borderTopColor: REPORT_COLORS.dark60,
    paddingTop: px(24),
  },
  closingClaim: {
    fontWeight: 400,
    fontSize: px(12),
    lineHeight: 1.4,
    color: REPORT_COLORS.gray40,
  },
});

interface AboutPageProps {
  footerLabel: string;
  pageNumber: number;
}

export function ContractReportExperiencePage({ footerLabel, pageNumber }: AboutPageProps) {
  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label="Sobre VEO" />
      <SectionIntro
        eyebrow="Experiencia"
        title="Más de 15 años operando nuestra propia red."
      />
      <View style={styles.tiles}>
        <View style={[styles.tileRow, styles.highlightRow]}>
          <StatTile stat={EXPERIENCE_HIGHLIGHT} tone="inverse" size="lg" />
        </View>
        {EXPERIENCE_STATS.map((row) => (
          <View key={row[0]!.label} style={styles.tileRow}>
            {row.map((stat) => (
              <StatTile key={stat.label} stat={stat} />
            ))}
          </View>
        ))}
      </View>
      <PageFooter label={footerLabel} pageNumber={pageNumber} />
    </Page>
  );
}

export function ContractReportFormatsPage({ footerLabel, pageNumber }: AboutPageProps) {
  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label="Sobre VEO" />
      <SectionIntro eyebrow="Nuestros formatos" title="Siete formatos, de 4 a 15 metros." />
      <View style={s.spacer} />
      <View style={styles.list}>
        {REPORT_FORMATS.map((format) => (
          <View key={format.icon} style={styles.formatRow}>
            <View style={styles.formatIconCell}>
              <Image src={REPORT_ASSETS.icon(format.icon)} style={styles.formatIcon} />
            </View>
            <Text style={styles.formatName}>{format.name}</Text>
            <Text style={styles.formatSize}>{format.size}</Text>
          </View>
        ))}
      </View>
      <PageFooter label={footerLabel} pageNumber={pageNumber} />
    </Page>
  );
}

export function ContractReportBenefitsPage({
  footerLabel,
  pageNumber,
  eyebrow = "Beneficios",
}: AboutPageProps & { eyebrow?: string }) {
  return (
    <Page size="LETTER" style={[s.page, s.pageIce]}>
      <PageHeader label="Sobre VEO" onIce />
      <SectionIntro eyebrow={eyebrow} title="Lo que incluye su campaña con VEO." />
      <View style={s.spacer} />
      <View style={styles.list}>
        {REPORT_BENEFITS.map((benefit, index) => (
          <View key={benefit} style={styles.benefitRow}>
            <Text style={styles.benefitNumber}>{String(index + 1).padStart(2, "0")}</Text>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>
      <PageFooter label={footerLabel} pageNumber={pageNumber} />
    </Page>
  );
}

export function ContractReportClosingPage({
  tagline = "Visible. Verificable. VEO.",
  taglineMaxChars,
}: {
  tagline?: string;
  taglineMaxChars?: number;
}) {
  return (
    <Page size="LETTER" style={[s.page, s.pageDark]}>
      <View style={styles.closingHero}>
        <Logo variant="light" height={48} />
        <Text
          style={[
            styles.closingTagline,
            taglineMaxChars ? { maxWidth: px(taglineMaxChars * 0.575 * 48) } : {},
          ]}
        >
          {tagline}
        </Text>
      </View>
      <View style={styles.closingFooter}>
        <View style={s.field}>
          <Eyebrow style={s.eyebrowOnDark}>VEO Media</Eyebrow>
          <Text style={s.fieldValue}>veo.com.sv</Text>
        </View>
        <Text style={styles.closingClaim}>Presencia visual inteligente</Text>
      </View>
    </Page>
  );
}
