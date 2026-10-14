import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import {
  type AgentToolContext,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';

const MAX_GROUP_ITEMS = 15;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface SalesRow {
  invoiceId: number;
  documentType: string;
  customerName: string;
  total: number;
  costCenterName: string;
  subCostCenterName: string | null;
  tipoVentaName: string;
  sellerName: string;
}

interface SalesReport {
  range: { from: string; to: string };
  total: number;
  rows: SalesRow[];
}

export interface SalesGroup {
  label: string;
  total: number;
  invoices: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function groupBy(
  rows: SalesRow[],
  pick: (row: SalesRow) => string,
): { items: SalesGroup[]; omitted: number } {
  const map = new Map<string, { total: number; invoices: Set<number> }>();
  for (const row of rows) {
    const label = pick(row);
    const entry = map.get(label) ?? { total: 0, invoices: new Set<number>() };
    entry.total += row.total;
    entry.invoices.add(row.invoiceId);
    map.set(label, entry);
  }
  const items = Array.from(map, ([label, e]) => ({
    label,
    total: round2(e.total),
    invoices: e.invoices.size,
  })).sort((a, b) => b.total - a.total);
  return {
    items: items.slice(0, MAX_GROUP_ITEMS),
    omitted: Math.max(items.length - MAX_GROUP_ITEMS, 0),
  };
}

export function buildSalesTools(ctx: AgentToolContext) {
  return {
    get_sales_summary: defineTool({
      description:
        'Official VEO sales (facturación) for a date range, computed exactly like the "Facturación por centro de costos" analytics view: posted, non-voided CCF, FCF and NDC documents from Brilo, line totals with VAT and line taxes, credit notes signed negative. Use it for ANY question about sales/billing totals ("venta del mes", "cuánto hemos facturado", sales by cost center, seller, client or document type). Never compute sales totals with run_query. ADMIN users get company-wide sales; other users get only their own sales as seller.',
      inputSchema: z.object({
        from: z
          .string()
          .regex(DATE_REGEX, 'Usa el formato YYYY-MM-DD')
          .describe('First day of the range, inclusive (YYYY-MM-DD)'),
        to: z
          .string()
          .regex(DATE_REGEX, 'Usa el formato YYYY-MM-DD')
          .describe('Last day of the range, inclusive (YYYY-MM-DD)'),
      }),
      execute: async ({ from, to }) => {
        const companyWide = hasScope(ctx.user, 'analytics');
        if (!companyWide && !hasScope(ctx.user, 'my_space')) {
          return unauthorized('analytics');
        }

        const response = await ctx.api.request<{ data: SalesReport }>({
          method: 'GET',
          path: companyWide
            ? '/analytics/sales-by-cost-center'
            : '/analytics/sales-by-cost-center/mine',
          query: { from, to },
        });
        if (!response.ok) return { ok: false as const, error: response.error };

        const report = response.data?.data;
        const rows = report?.rows ?? [];
        return {
          ok: true as const,
          scope: companyWide ? 'company' : 'own_sales',
          range: report?.range ?? { from, to },
          total: report?.total ?? 0,
          invoices: new Set(rows.map((r) => r.invoiceId)).size,
          byCostCenter: groupBy(rows, (r) => r.costCenterName),
          bySubCostCenter: groupBy(
            rows,
            (r) => r.subCostCenterName ?? 'Sub Centro de Costos- N/A',
          ),
          bySaleType: groupBy(rows, (r) => r.tipoVentaName),
          byDocumentType: groupBy(rows, (r) => r.documentType),
          bySeller: groupBy(rows, (r) => r.sellerName),
          topCustomers: groupBy(rows, (r) => r.customerName),
        };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),
  };
}
