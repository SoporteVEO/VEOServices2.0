import { Image, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { DOC_COLORS, DOC_LOGO, docStyles as s } from "./veo-document-styles";

export const LESSOR_COMPANY_NAME = "ARHEDES S.A. DE C.V.";

export function DocHeader({ meta }: { meta?: string }) {
  return (
    <View style={s.header}>
      <Image
        src={DOC_LOGO.src}
        style={{ width: DOC_LOGO.width, height: DOC_LOGO.height }}
      />
      <View style={s.headerMeta}>
        <Text style={s.headerCompany}>{LESSOR_COMPANY_NAME}</Text>
        {meta ? <Text style={s.headerDate}>{meta}</Text> : null}
      </View>
    </View>
  );
}

export function DocTitle({ title, badge }: { title: string; badge: string }) {
  return (
    <View style={s.titleRow}>
      <Text style={s.title}>{title}</Text>
      <View style={s.badge}>
        <View style={s.badgeDot} />
        <Text style={s.badgeText}>{badge}</Text>
      </View>
    </View>
  );
}

export function DocInfoCell({
  label,
  value,
  valueStyle,
  width,
  highlight,
}: {
  label: string;
  value: string;
  valueStyle: Style;
  /** Fixed share of the row, so cells line up with the row above. */
  width?: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        s.infoCell,
        width ? { flexGrow: 0, flexShrink: 0, flexBasis: width } : {},
        highlight ? s.infoCellHighlight : {},
      ]}
    >
      {highlight ? (
        <View style={s.infoLabelHighlight}>
          <View style={s.infoLabelDot} />
          <Text style={[s.infoLabel, { color: DOC_COLORS.lime }]}>{label}</Text>
        </View>
      ) : (
        <Text style={s.infoLabel}>{label}</Text>
      )}
      <Text style={valueStyle}>{value}</Text>
    </View>
  );
}

export interface DocSigner {
  label: string;
  name: string;
}

export function DocSignatures({ signers }: { signers: [DocSigner, DocSigner] }) {
  return (
    <View style={s.signatures} wrap={false}>
      {signers.map((signer, index) => (
        <View key={index} style={s.signatureColumn}>
          <View style={s.signatureLine} />
          <Text style={s.signatureLabel}>{signer.label}</Text>
          <Text style={s.signatureName}>{signer.name}</Text>
        </View>
      ))}
    </View>
  );
}

export function DocFooter({
  dotColor,
  note,
}: {
  dotColor: string;
  note?: string;
}) {
  return (
    <View fixed style={s.footer}>
      {note ? <Text style={s.footerNote}>{note}</Text> : null}
      <View style={s.footerPager}>
        <Text
          style={s.footerPage}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
        <View style={[s.footerDot, { backgroundColor: dotColor }]} />
      </View>
    </View>
  );
}
