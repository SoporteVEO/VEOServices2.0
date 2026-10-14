import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import { normalizeText, rankBySimilarity } from '../agent-text-similarity.js';
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

const COMPANY_SUFFIX =
  /\b(s\s*a\s*de\s*c\s*v|s\s*a|s\s*de\s*r\s*l(\s*de\s*c\s*v)?|ltda)\b/g;

function customerKey(name: string): string {
  return normalizeText(name)
    .replace(COMPANY_SUFFIX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function filterByCustomer(rows: SalesRow[], customer: string) {
  const key = customerKey(customer);
  const names = [...new Set(rows.map((r) => r.customerName))];
  const matched = key
    ? names.filter((name) => customerKey(name).includes(key))
    : [];
  const suggestions = matched.length
    ? []
    : rankBySimilarity(customer, names, (name) => name, {
        limit: 5,
        minScore: 0.2,
      }).map((r) => r.item);
  const set = new Set(matched);
  return {
    rows: rows.filter((r) => set.has(r.customerName)),
    matched,
    suggestions,
  };
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
        'Official VEO sales (facturación) for a date range, computed exactly like the "Facturación por centro de costos" analytics view: posted, non-voided CCF, FCF and NDC documents from Brilo, line totals with VAT and line taxes, credit notes signed negative. Use it for ANY question about sales/billing totals ("venta del mes", "cuánto hemos facturado", sales by cost center, seller, client or document type). When the question names a client ("ventas a X", "compras de X", "lo que nos ha comprado X"), pass `customer` so the totals are for that client only. Never compute sales totals with run_query. ADMIN users get company-wide sales; other users get only their own sales as seller.',
      inputSchema: z.object({
        from: z
          .string()
          .regex(DATE_REGEX, 'Usa el formato YYYY-MM-DD')
          .describe('First day of the range, inclusive (YYYY-MM-DD)'),
        to: z
          .string()
          .regex(DATE_REGEX, 'Usa el formato YYYY-MM-DD')
          .describe('Last day of the range, inclusive (YYYY-MM-DD)'),
        customer: z
          .string()
          .min(2)
          .max(120)
          .optional()
          .describe(
            'Client name or part of it (case, accents and "S.A. de C.V." are ignored). Omit for all clients.',
          ),
      }),
      execute: async ({ from, to, customer }) => {
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
        const allRows = report?.rows ?? [];
        const filter = customer ? filterByCustomer(allRows, customer) : null;
        const rows = filter?.rows ?? allRows;
        return {
          ok: true as const,
          scope: companyWide ? 'company' : 'own_sales',
          range: report?.range ?? { from, to },
          ...(filter
            ? {
                customerFilter: {
                  query: customer,
                  matchedCustomers: filter.matched,
                  ...(filter.matched.length
                    ? {}
                    : {
                        note: 'Ningún cliente con ventas en el periodo coincide con ese nombre. Revisa las sugerencias o pregunta al usuario.',
                        suggestions: filter.suggestions,
                      }),
                },
              }
            : {}),
          total: filter
            ? round2(rows.reduce((sum, r) => sum + r.total, 0))
            : (report?.total ?? 0),
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
