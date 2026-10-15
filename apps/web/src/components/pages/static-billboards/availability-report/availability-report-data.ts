import { formatHumanDayDate } from "@/lib/format";
import { formatReportDate } from "@/components/pages/reports/pdf/contract-report-pdf-data";
import {
  PAGE_HEIGHT,
  PAGE_PADDING,
  PAGE_WIDTH,
} from "@/components/pages/reports/pdf/contract-report-pdf-styles";

export interface AvailabilityPdfBillboard {
  code: string;
  address: string;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  impressionPrice: number | null;
  /** JPEG data URL; react-pdf can't decode the WebP photos stored in S3. */
  image: string | null;
}

export interface AvailabilityReportPdfData {
  /** First day of the requested range; the report is dated on it. */
  availableFrom: Date;
  billboards: AvailabilityPdfBillboard[];
}

export interface AvailabilityIndexRow {
  billboard: AvailabilityPdfBillboard;
  pageNumber: number;
}

const COUNT_WORDS = [
  "Cero",
  "Una",
  "Dos",
  "Tres",
  "Cuatro",
  "Cinco",
  "Seis",
  "Siete",
  "Ocho",
  "Nueve",
  "Diez",
];

function countWord(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

function unique(values: (string | null)[]): string[] {
  return [...new Set(values.map((v) => v?.trim()).filter((v): v is string => !!v))];
}

function formatDecimal(value: number, fractionDigits?: number): string {
  const text =
    fractionDigits == null ? String(Number(value.toFixed(2))) : value.toFixed(fractionDigits);
  return text.replace(".", ",");
}

const NBSP = "\u00A0";

/** "6,00 × 3,60 m", the size shown in tables and billboard pages. */
export function formatSize(width: number | null, height: number | null): string {
  if (width == null || height == null) return "—";
  return `${formatDecimal(width, 2)}${NBSP}×${NBSP}${formatDecimal(height, 2)}${NBSP}m`;
}

/** "6 × 3,6 m", the size used inside headlines. */
function formatShortSize(width: number, height: number): string {
  return `${formatDecimal(width)}${NBSP}×${NBSP}${formatDecimal(height)}${NBSP}m`;
}

export function formatReportPrice(value: number | null): string {
  if (value == null) return "—";
  const grouped = String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${grouped}`;
}

function formatNumericDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function isAvailableNow(availableFrom: Date): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return availableFrom.getTime() <= today.getTime();
}

function placeName(billboards: AvailabilityPdfBillboard[]): string {
  const cities = unique(billboards.map((b) => b.cityName));
  if (cities.length === 1) return cities[0]!;
  const departments = unique(billboards.map((b) => b.departmentName));
  if (departments.length === 1) return departments[0]!;
  return "El Salvador";
}

function zoneLabel(billboards: AvailabilityPdfBillboard[]): string {
  const departments = unique(billboards.map((b) => b.departmentName));
  if (departments.length === 0) return "—";
  if (departments.length === 1) return departments[0]!;
  return `${departments.length} departamentos`;
}

function sharedShortSize(billboards: AvailabilityPdfBillboard[]): string | null {
  const sizes = unique(
    billboards.map((b) =>
      b.width != null && b.height != null ? formatShortSize(b.width, b.height) : null,
    ),
  );
  const allSized = billboards.every((b) => b.width != null && b.height != null);
  return allSized && sizes.length === 1 ? sizes[0]! : null;
}

export interface AvailabilityReportCopy {
  coverDate: string;
  headerDate: string;
  footerLabel: string;
  coverTitle: string;
  coverLead: string;
  zone: string;
  countLabel: string;
  availability: string;
  badge: string;
  summaryTitle: string;
  summaryLead: string;
}

export function buildAvailabilityCopy(data: AvailabilityReportPdfData): AvailabilityReportCopy {
  const { availableFrom, billboards } = data;
  const count = billboards.length;
  const now = isAvailableNow(availableFrom);
  const place = placeName(billboards);
  const size = sharedShortSize(billboards);
  const vallas = plural(count, "valla", "vallas");
  const startDate = formatHumanDayDate(availableFrom, { weekday: false, capitalized: false });
  const startShort = formatReportDate(availableFrom);

  const allAvailable =
    count === 1
      ? "Está disponible"
      : count === 2
        ? "Ambas están disponibles"
        : "Todas están disponibles";

  const contractable = plural(
    count,
    "La estructura se puede contratar",
    "Las estructuras se pueden contratar",
  );

  return {
    coverDate: startDate,
    headerDate: startShort,
    footerLabel: `Disponibilidad ${formatNumericDate(availableFrom)}`,
    coverTitle: `${countWord(count)} ${vallas} ${plural(count, "libre", "libres")} en ${place}.`,
    coverLead: `Ubicación, medida, precio y fotografía de cada estructura. ${allAvailable} ${
      now ? "de inmediato" : `desde el ${startDate}`
    }.`,
    zone: zoneLabel(billboards),
    countLabel: `${count} ${vallas}`,
    availability: now ? "De inmediato" : `Desde ${startShort}`,
    badge: now ? "Disponible de inmediato" : `Disponible desde ${startShort}`,
    summaryTitle: size
      ? `${countWord(count)} ${vallas} de ${size} en ${place}.`
      : `${countWord(count)} ${vallas} ${plural(count, "disponible", "disponibles")} en ${place}.`,
    summaryLead: `${contractable} ${
      now ? "desde hoy" : `a partir del ${startDate}`
    }. Cada ficha incluye código, ubicación, coordenadas y una fotografía de la valla en sitio.`,
  };
}

/** Widths in px of the index table columns; the address takes the rest. */
export const INDEX_COLUMNS = { code: 116, size: 136, price: 148, page: 48 } as const;

const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2;
const ADDRESS_TEXT_WIDTH =
  CONTENT_WIDTH -
  INDEX_COLUMNS.code -
  INDEX_COLUMNS.size -
  INDEX_COLUMNS.price -
  INDEX_COLUMNS.page -
  24;
/** Funnel Sans Light averages 0.44em per character; rounded up for safety. */
const ADDRESS_MAX_CHARS = Math.floor(ADDRESS_TEXT_WIDTH / (14 * 0.47));
const ADDRESS_LINE_HEIGHT = 14 * 1.4;
const CODE_LINE_HEIGHT = 16 * 1.4;
const ROW_CHROME = 24 + 1;

const TITLE_MAX_CHARS = 15;
const LEAD_MAX_CHARS = 58;

const HEADER_HEIGHT = 18 + 18 + 1;
const FOOTER_HEIGHT = 36 + 12;
const TABLE_HEAD_HEIGHT = 12 * 3 + 1;
const SAFETY = 12;
const PAGE_BODY = PAGE_HEIGHT - PAGE_PADDING * 2 - HEADER_HEIGHT - FOOTER_HEIGHT - SAFETY;
const TABLE_CHROME = 12 + 12 + TABLE_HEAD_HEIGHT;

function estimateLines(text: string, maxChars: number): number {
  let lines = 1;
  let current = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = current === 0 ? word.length : current + 1 + word.length;
    if (next <= maxChars || current === 0) {
      current = next;
    } else {
      lines += 1;
      current = word.length;
    }
  }
  return lines;
}

function estimateRowHeight(billboard: AvailabilityPdfBillboard): number {
  const addressHeight =
    estimateLines(billboard.address || "—", ADDRESS_MAX_CHARS) * ADDRESS_LINE_HEIGHT;
  return ROW_CHROME + Math.max(CODE_LINE_HEIGHT, addressHeight);
}

function summaryRowsBudget(copy: AvailabilityReportCopy): number {
  const intro =
    72 +
    12 +
    24 +
    estimateLines(copy.summaryTitle, TITLE_MAX_CHARS) * 48 * 1.1 +
    24 +
    estimateLines(copy.summaryLead, LEAD_MAX_CHARS) * 18 * 1.6;
  return PAGE_BODY - intro - 48 - TABLE_CHROME;
}

const CONTINUATION_ROWS_BUDGET = PAGE_BODY - 72 - TABLE_CHROME;

/**
 * Splits the availability table into pages before rendering, so each row can
 * print the page number its billboard lands on. The first page shares room
 * with the summary intro; the rest only carry the table.
 */
export function paginateAvailabilityIndex(
  billboards: AvailabilityPdfBillboard[],
  copy: AvailabilityReportCopy,
  firstBillboardPage: number,
): AvailabilityIndexRow[][] {
  const pages: AvailabilityIndexRow[][] = [];
  let current: AvailabilityIndexRow[] = [];
  let used = 0;
  let budget = summaryRowsBudget(copy);

  billboards.forEach((billboard, index) => {
    const height = estimateRowHeight(billboard);
    if (current.length > 0 && used + height > budget) {
      pages.push(current);
      current = [];
      used = 0;
      budget = CONTINUATION_ROWS_BUDGET;
    }
    current.push({ billboard, pageNumber: firstBillboardPage + index });
    used += height;
  });

  if (current.length > 0 || pages.length === 0) pages.push(current);
  return pages;
}
