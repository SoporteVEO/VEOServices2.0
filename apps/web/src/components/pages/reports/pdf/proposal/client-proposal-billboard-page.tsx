import { Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { getMapsUrl } from "@/lib/utils";
import {
  ArrowUpRight,
  Eyebrow,
  Field,
  PageFooter,
  PageHeader,
} from "../contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "../contract-report-pdf-styles";
import {
  formatPlace,
  formatProposalMoney,
  formatProposalSize,
  type ProposalPdfBillboard,
} from "./client-proposal-pdf-data";

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: px(24),
    paddingTop: px(30),
    paddingBottom: px(18),
  },
  titleBlock: { gap: px(12) },
  code: displayText(64, 0.95),
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(6),
    paddingVertical: px(6),
    paddingHorizontal: px(12),
    backgroundColor: REPORT_COLORS.lime,
  },
  badgeText: {
    fontWeight: 600,
    fontSize: px(12),
    lineHeight: 1.4,
    letterSpacing: px(12 * 0.08),
    textTransform: "uppercase",
    color: REPORT_COLORS.dark,
  },
  photoFrame: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: REPORT_COLORS.dark,
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  placeholder: {
    fontWeight: 400,
    fontSize: px(14),
    color: REPORT_COLORS.gray40,
  },
  reason: {
    gap: px(8),
    marginTop: px(18),
    padding: px(18),
    backgroundColor: REPORT_COLORS.ice,
    borderLeftWidth: px(4),
    borderLeftColor: REPORT_COLORS.lime,
  },
  reasonText: {
    fontWeight: 300,
    fontSize: px(17),
    lineHeight: 1.45,
  },
  details: {
    marginTop: px(18),
    borderTopWidth: px(1),
    borderTopColor: REPORT_COLORS.dark,
  },
  addressCell: {
    paddingVertical: px(14),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray20,
  },
  address: {
    fontWeight: 300,
    fontSize: px(15),
    lineHeight: 1.45,
  },
  facts: { flexDirection: "row" },
  fact: {
    flex: 1,
    gap: px(6),
    paddingTop: px(14),
    paddingHorizontal: px(14),
    borderLeftWidth: px(1),
    borderLeftColor: REPORT_COLORS.gray20,
  },
  factFirst: {
    paddingLeft: 0,
    borderLeftWidth: 0,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(4),
    color: REPORT_COLORS.dark,
    textDecoration: "none",
  },
  linkText: {
    fontWeight: 400,
    fontSize: px(16),
    lineHeight: 1.4,
    textDecoration: "underline",
  },
});

export function ClientProposalBillboardPage({
  billboard,
  position,
  total,
  company,
  pageNumber,
}: {
  billboard: ProposalPdfBillboard;
  position: number;
  total: number;
  company: string;
  pageNumber: number;
}) {
  const mapsUrl = getMapsUrl(billboard.latitude, billboard.longitude);
  const address = [billboard.address, billboard.reference]
    .filter(Boolean)
    .join(" · ");

  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label={`Espacio ${position} de ${total}`} />

      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Eyebrow>Código de valla</Eyebrow>
          <Text style={styles.code}>{billboard.code}</Text>
        </View>
        <View style={styles.badge}>
          <View style={s.square} />
          <Text style={styles.badgeText}>Disponible</Text>
        </View>
      </View>

      <View style={styles.photoFrame}>
        {billboard.image ? (
          <Image src={billboard.image} style={styles.photo} />
        ) : (
          <Text style={styles.placeholder}>Fotografía disponible a solicitud</Text>
        )}
      </View>

      <View style={styles.reason} wrap={false}>
        <Eyebrow>Por qué este espacio</Eyebrow>
        <Text style={styles.reasonText}>{billboard.reason}</Text>
      </View>

      <View style={styles.details} wrap={false}>
        <View style={[s.field, styles.addressCell]}>
          <Eyebrow>Dirección</Eyebrow>
          <Text style={styles.address}>{address || "—"}</Text>
        </View>
        <View style={styles.facts}>
          <Field
            label="Ubicación"
            value={formatPlace(billboard)}
            style={{ ...styles.fact, ...styles.factFirst }}
          />
          <Field
            label="Medidas"
            value={formatProposalSize(billboard.width, billboard.height)}
            style={styles.fact}
          />
          <Field
            label="Tarifa mensual"
            value={formatProposalMoney(billboard.monthlyPrice)}
            style={styles.fact}
          />
          <View style={styles.fact}>
            <Eyebrow>Mapa</Eyebrow>
            {mapsUrl ? (
              <Link src={mapsUrl} style={styles.link}>
                <Text style={styles.linkText}>Google Maps</Text>
                <ArrowUpRight size={14} color={REPORT_COLORS.dark} />
              </Link>
            ) : (
              <Text style={s.fieldValue}>—</Text>
            )}
          </View>
        </View>
      </View>

      <PageFooter label={company} pageNumber={pageNumber} marginTop={18} />
    </Page>
  );
}
