import { PAGE_HEIGHT, PAGE_PADDING, PAGE_WIDTH } from "./contract-report-pdf-styles";

export interface ReportPdfBillboard {
  code: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  /** JPEG data URL; react-pdf can't decode the WebP photos stored in S3. */
  image: string;
  capturedAt: Date | null;
}

export interface ContractReportPdfData {
  contractNumber: string;
  customerName: string;
  customerEmail: string;
  campaign: string;
  period: string;
  /** Billboards in the contract, including the ones left out for lack of a photo. */
  totalBillboards: number;
  billboards: ReportPdfBillboard[];
}

export interface IndexRow {
  billboard: ReportPdfBillboard;
  pageNumber: number;
}

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function formatReportDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatReportDateTime(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours < 12 ? "a.m." : "p.m.";
  return `${formatReportDate(date)} · ${hours % 12 || 12}:${minutes} ${suffix}`;
}

function formatCoordinate(value: number): string {
  return String(Number(value.toFixed(4))).replace("-", "−");
}

export function formatCoordinates(
  latitude: number | null,
  longitude: number | null,
): string | null {
  if (latitude == null || longitude == null) return null;
  return `${formatCoordinate(latitude)}, ${formatCoordinate(longitude)}`;
}

export function formatPageNumber(pageNumber: number): string {
  return String(pageNumber).padStart(2, "0");
}

export function formatBillboardCount(count: number): string {
  return `${count} ${count === 1 ? "valla" : "vallas"}`;
}

/** "Octubre 2026" → "Octubre\n2026", the cover's two-line period. */
export function splitPeriodTitle(period: string): string {
  const lastSpace = period.lastIndexOf(" ");
  if (lastSpace < 0) return period;
  return `${period.slice(0, lastSpace)}\n${period.slice(lastSpace + 1)}`;
}

/** Widths in px of the index table columns; the address takes the rest. */
export const INDEX_COLUMNS = { code: 96, date: 100, page: 48 } as const;

const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2;
const ADDRESS_TEXT_WIDTH =
  CONTENT_WIDTH - INDEX_COLUMNS.code - INDEX_COLUMNS.date - INDEX_COLUMNS.page - 24;
/** Funnel Sans Light averages 0.44em per character; rounded up for safety. */
const ADDRESS_CHAR_WIDTH = 14 * 0.47;
const ADDRESS_LINE_HEIGHT = 14 * 1.4;
const ROW_CHROME = 24 + 1;

const HEADER_HEIGHT = 18 + 18 + 1;
const FOOTER_HEIGHT = 36 + 12;
const TABLE_HEAD_HEIGHT = 12 * 3 + 1;
const INDEX_ROWS_BUDGET =
  PAGE_HEIGHT -
  PAGE_PADDING * 2 -
  HEADER_HEIGHT -
  72 -
  12 -
  12 -
  TABLE_HEAD_HEIGHT -
  FOOTER_HEIGHT;

function estimateLines(text: string): number {
  const maxChars = Math.floor(ADDRESS_TEXT_WIDTH / ADDRESS_CHAR_WIDTH);
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

function estimateRowHeight(billboard: ReportPdfBillboard): number {
  return ROW_CHROME + estimateLines(billboard.address || "—") * ADDRESS_LINE_HEIGHT;
}

/**
 * Splits the billboard index into pages before rendering, so each row can
 * print the page number its billboard lands on.
 */
export function paginateIndex(
  billboards: ReportPdfBillboard[],
  firstBillboardPage: number,
): IndexRow[][] {
  const pages: IndexRow[][] = [];
  let current: IndexRow[] = [];
  let used = 0;

  billboards.forEach((billboard, index) => {
    const height = estimateRowHeight(billboard);
    if (current.length > 0 && used + height > INDEX_ROWS_BUDGET) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push({ billboard, pageNumber: firstBillboardPage + index });
    used += height;
  });

  if (current.length > 0) pages.push(current);
  return pages;
}

export function countIndexPages(billboards: ReportPdfBillboard[]): number {
  return paginateIndex(billboards, 0).length;
}
