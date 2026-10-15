import { Image, Path, Svg, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import {
  ISOTIPO_RATIO,
  LOGO_RATIO,
  REPORT_ASSETS,
  type ReportStat,
} from "./contract-report-pdf-content";
import { formatPageNumber } from "./contract-report-pdf-data";
import {
  displayText,
  px,
  REPORT_COLORS,
  reportStyles as s,
} from "./contract-report-pdf-styles";

export function Logo({ variant, height }: { variant: "light" | "dark"; height: number }) {
  return (
    <Image
      src={variant === "light" ? REPORT_ASSETS.logoLight : REPORT_ASSETS.logoDark}
      style={{ height: px(height), width: px(height * LOGO_RATIO) }}
    />
  );
}

export function Eyebrow({ children, style }: { children: string; style?: Style }) {
  return <Text style={[s.eyebrow, style ?? {}]}>{children}</Text>;
}

export function PageHeader({ label, onIce = false }: { label: string; onIce?: boolean }) {
  return (
    <View style={[s.header, onIce ? s.headerOnIce : {}]}>
      <Logo variant="dark" height={18} />
      <Eyebrow>{label}</Eyebrow>
    </View>
  );
}

export function PageFooter({
  label,
  pageNumber,
  marginTop = 36,
}: {
  label: string;
  pageNumber: number;
  marginTop?: number;
}) {
  return (
    <View style={[s.footer, { marginTop: px(marginTop) }]}>
      <Text style={s.footerText}>{`VEO · ${label}`}</Text>
      <View style={s.footerPager}>
        <View style={s.square} />
        <Text style={s.footerText}>{formatPageNumber(pageNumber)}</Text>
      </View>
    </View>
  );
}

export function SectionIntro({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={s.intro}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onDark = false,
  style,
}: {
  label: string;
  value: string;
  onDark?: boolean;
  style?: Style;
}) {
  return (
    <View style={[s.field, style ?? {}]}>
      <Eyebrow style={onDark ? s.eyebrowOnDark : undefined}>{label}</Eyebrow>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

export function VerificationSeal({
  value,
  label,
  meta,
}: {
  value: string;
  label: string;
  meta: string;
}) {
  return (
    <View style={s.seal}>
      <Image
        src={REPORT_ASSETS.isotipoLime}
        style={{ height: px(30), width: px(30 * ISOTIPO_RATIO) }}
      />
      <View style={s.sealBody}>
        <Text style={s.sealValue}>{value}</Text>
        <Text style={s.sealLabel}>{label}</Text>
        <Text style={s.sealMeta}>{meta}</Text>
      </View>
    </View>
  );
}

const STAT_TONES = {
  inverse: { background: REPORT_COLORS.dark, value: REPORT_COLORS.lime, label: REPORT_COLORS.white },
  sunken: { background: REPORT_COLORS.ice, value: REPORT_COLORS.dark, label: REPORT_COLORS.gray },
} as const;

export function StatTile({
  stat,
  tone = "sunken",
  size = "md",
}: {
  stat: ReportStat;
  tone?: keyof typeof STAT_TONES;
  size?: "md" | "lg";
}) {
  const colors = STAT_TONES[tone];
  return (
    <View
      style={[
        s.statTile,
        { backgroundColor: colors.background, minHeight: px(size === "lg" ? 144 : 132) },
      ]}
    >
      <Text style={[displayText(size === "lg" ? 72 : 48, 1), { color: colors.value }]}>
        {stat.value}
      </Text>
      <Text style={[s.statLabel, { color: colors.label }]}>{stat.label}</Text>
    </View>
  );
}

/** Funnel Sans has no ↗ glyph, so the CTA arrow is drawn. */
export function ArrowUpRight({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={px(size)} height={px(size)} viewBox="0 0 12 12">
      <Path
        d="M3 9 L9 3 M4 3 H9 V8"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="square"
        fill="none"
      />
    </Svg>
  );
}
