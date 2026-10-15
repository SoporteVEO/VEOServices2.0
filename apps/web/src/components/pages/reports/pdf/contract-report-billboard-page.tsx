import { Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { getMapsUrl } from "@/lib/utils";
import {
  formatCoordinates,
  formatReportDateTime,
  type ReportPdfBillboard,
} from "./contract-report-pdf-data";
import {
  ArrowUpRight,
  Eyebrow,
  Field,
  PageFooter,
  PageHeader,
} from "./contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "./contract-report-pdf-styles";

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: px(24),
    paddingTop: px(36),
    paddingBottom: px(24),
  },
  titleBlock: {
    gap: px(12),
  },
  code: displayText(72, 0.95),
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
  figure: {
    flex: 1,
    minHeight: 0,
    gap: px(12),
  },
  photoFrame: {
    flex: 1,
    minHeight: 0,
    backgroundColor: REPORT_COLORS.dark,
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  caption: {
    fontWeight: 400,
    fontSize: px(12),
    lineHeight: 1.4,
    color: REPORT_COLORS.dark60,
  },
  details: {
    marginTop: px(24),
    borderTopWidth: px(1),
    borderTopColor: REPORT_COLORS.dark,
  },
  addressCell: {
    paddingVertical: px(18),
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray20,
  },
  address: {
    fontWeight: 300,
    fontSize: px(16),
    lineHeight: 1.5,
  },
  facts: {
    flexDirection: "row",
  },
  fact: {
    flex: 1,
    gap: px(6),
    paddingTop: px(18),
  },
  factFirst: {
    paddingRight: px(18),
  },
  factMiddle: {
    paddingHorizontal: px(18),
    borderLeftWidth: px(1),
    borderLeftColor: REPORT_COLORS.gray20,
  },
  factLast: {
    paddingLeft: px(18),
    borderLeftWidth: px(1),
    borderLeftColor: REPORT_COLORS.gray20,
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

export function ContractReportBillboardPage({
  billboard,
  position,
  total,
  contractNumber,
  pageNumber,
}: {
  billboard: ReportPdfBillboard;
  position: number;
  total: number;
  contractNumber: string;
  pageNumber: number;
}) {
  const mapsUrl = getMapsUrl(billboard.latitude, billboard.longitude);

  return (
    <Page size="LETTER" style={s.page}>
      <PageHeader label={`Valla ${position} de ${total}`} />

      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Eyebrow>Código de valla</Eyebrow>
          <Text style={styles.code}>{billboard.code || "—"}</Text>
        </View>
        <View style={styles.badge}>
          <View style={s.square} />
          <Text style={styles.badgeText}>En exhibición</Text>
        </View>
      </View>

      <View style={styles.figure}>
        <View style={styles.photoFrame}>
          <Image src={billboard.image} style={styles.photo} />
        </View>
        <Text style={styles.caption}>
          Fotografía tomada en sitio. Fecha, hora y ubicación impresas en la
          imagen al momento del registro.
        </Text>
      </View>

      <View style={styles.details}>
        <View style={[s.field, styles.addressCell]}>
          <Eyebrow>Dirección</Eyebrow>
          <Text style={styles.address}>{billboard.address || "—"}</Text>
        </View>
        <View style={styles.facts}>
          <Field
            label="Registro"
            value={
              billboard.capturedAt ? formatReportDateTime(billboard.capturedAt) : "—"
            }
            style={{ ...styles.fact, ...styles.factFirst }}
          />
          <Field
            label="Coordenadas"
            value={formatCoordinates(billboard.latitude, billboard.longitude) ?? "—"}
            style={{ ...styles.fact, ...styles.factMiddle }}
          />
          <View style={[styles.fact, styles.factLast]}>
            <Eyebrow>Ubicación en mapa</Eyebrow>
            {mapsUrl ? (
              <Link src={mapsUrl} style={styles.link}>
                <Text style={styles.linkText}>Abrir en Google Maps</Text>
                <ArrowUpRight size={14} color={REPORT_COLORS.dark} />
              </Link>
            ) : (
              <Text style={s.fieldValue}>—</Text>
            )}
          </View>
        </View>
      </View>

      <PageFooter label={contractNumber} pageNumber={pageNumber} marginTop={24} />
    </Page>
  );
}
