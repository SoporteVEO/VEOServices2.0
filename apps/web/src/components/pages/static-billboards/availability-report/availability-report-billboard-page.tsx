import { Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { getMapsUrl } from "@/lib/utils";
import { formatCoordinates } from "@/components/pages/reports/pdf/contract-report-pdf-data";
import {
  ArrowUpRight,
  Eyebrow,
  Field,
  PageFooter,
  PageHeader,
} from "@/components/pages/reports/pdf/contract-report-pdf-parts";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "@/components/pages/reports/pdf/contract-report-pdf-styles";
import {
  formatReportPrice,
  formatSize,
  type AvailabilityPdfBillboard,
  type AvailabilityReportCopy,
} from "./availability-report-data";

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
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  noPhoto: {
    fontWeight: 400,
    fontSize: px(14),
    lineHeight: 1.4,
    color: REPORT_COLORS.gray40,
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
  factsRow: {
    flexDirection: "row",
  },
  factsRowRuled: {
    borderBottomWidth: px(1),
    borderBottomColor: REPORT_COLORS.gray20,
  },
  fact: {
    flex: 1,
    gap: px(6),
  },
  divided: {
    borderLeftWidth: px(1),
    borderLeftColor: REPORT_COLORS.gray20,
  },
  figureValue: displayText(24, 1.1),
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

function pad(top: number, right: number, bottom: number, left: number): Style {
  return {
    paddingTop: px(top),
    paddingRight: px(right),
    paddingBottom: px(bottom),
    paddingLeft: px(left),
  };
}

function FigureFact({ label, value, style }: { label: string; value: string; style: Style[] }) {
  return (
    <View style={style}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={styles.figureValue}>{value}</Text>
    </View>
  );
}

export function AvailabilityReportBillboardPage({
  billboard,
  copy,
  position,
  total,
  pageNumber,
}: {
  billboard: AvailabilityPdfBillboard;
  copy: AvailabilityReportCopy;
  position: number;
  total: number;
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
          <Text style={styles.badgeText}>{copy.badge}</Text>
        </View>
      </View>

      <View style={styles.figure}>
        <View style={styles.photoFrame}>
          {billboard.image ? (
            <Image src={billboard.image} style={styles.photo} />
          ) : (
            <Text style={styles.noPhoto}>Sin fotografía disponible</Text>
          )}
        </View>
        <Text style={styles.caption}>
          {billboard.image
            ? "Fotografía de la estructura en sitio."
            : "Esta estructura aún no tiene fotografía mensual registrada."}
        </Text>
      </View>

      <View style={styles.details}>
        <View style={[s.field, styles.addressCell]}>
          <Eyebrow>Ubicación</Eyebrow>
          <Text style={styles.address}>{billboard.address || "—"}</Text>
        </View>

        <View style={[styles.factsRow, styles.factsRowRuled]}>
          <Field
            label="Medida"
            value={formatSize(billboard.width, billboard.height)}
            style={{ ...styles.fact, ...pad(18, 18, 18, 0) }}
          />
          <Field
            label="Coordenadas"
            value={formatCoordinates(billboard.latitude, billboard.longitude) ?? "—"}
            style={{ ...styles.fact, ...styles.divided, ...pad(18, 18, 18, 18) }}
          />
          <View style={[styles.fact, styles.divided, pad(18, 0, 18, 18)]}>
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

        <View style={styles.factsRow}>
          <FigureFact
            label="Canon mensual"
            value={formatReportPrice(billboard.price)}
            style={[styles.fact, pad(18, 18, 0, 0)]}
          />
          <FigureFact
            label="Impresión"
            value={formatReportPrice(billboard.impressionPrice)}
            style={[styles.fact, styles.divided, pad(18, 18, 0, 18)]}
          />
          <FigureFact
            label="Disponibilidad"
            value={copy.availability}
            style={[styles.fact, styles.divided, pad(18, 0, 0, 18)]}
          />
        </View>
      </View>

      <PageFooter label={copy.footerLabel} pageNumber={pageNumber} marginTop={24} />
    </Page>
  );
}
