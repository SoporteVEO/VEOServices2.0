export interface ProposalPdfBillboard {
  code: string;
  address: string;
  reference: string | null;
  city: string | null;
  department: string | null;
  width: number | null;
  height: number | null;
  monthlyPrice: number | null;
  latitude: number | null;
  longitude: number | null;
  /** JPEG data URL, or null when the billboard has no usable photo. */
  image: string | null;
  reason: string;
}

export interface ClientProposalPdfData {
  company: string;
  contactName: string | null;
  contactRole: string;
  contactEmail: string | null;
  objective: string;
  period: string;
  brandSummary: string;
  audience: string | null;
  strategy: string[];
  billboards: ProposalPdfBillboard[];
  monthlyInvestment: number;
  preparedBy: string;
  preparedByEmail: string;
  createdAt: Date;
}

/** Fixed row count keeps the investment table on predictable pages. */
export const INVESTMENT_ROWS_PER_PAGE = 9;

export function chunkInvestmentRows<T>(rows: T[]): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < rows.length; i += INVESTMENT_ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + INVESTMENT_ROWS_PER_PAGE));
  }
  return pages.length > 0 ? pages : [[]];
}

export function formatProposalMoney(value: number | null): string {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatProposalSize(width: number | null, height: number | null) {
  if (width == null || height == null) return "—";
  const fmt = (n: number) => n.toLocaleString("es-SV", { maximumFractionDigits: 2 });
  return `${fmt(width)} × ${fmt(height)} m`;
}

export function formatPlace(billboard: ProposalPdfBillboard): string {
  return [billboard.city, billboard.department]
    .filter((part, index, all) => part && all.indexOf(part) === index)
    .join(", ") || "—";
}

export function countCities(billboards: ProposalPdfBillboard[]): number {
  return new Set(billboards.map((b) => b.city).filter(Boolean)).size;
}
