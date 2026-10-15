import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import {
  type AgentToolContext,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';

const MAX_CONTRACTS = 10;
const MAX_CODES = 20;
const EL_SALVADOR_OFFSET = '-06:00';

interface ActiveContractGroup {
  contractNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  description: string | null;
  endDate: string;
  totalBillboards: number;
  billboardsWithImages: number;
  totalImages: number;
  reportsSendedCount: number;
  billboards: { billboardCode: string }[];
}

function monthStart(month: string): Date {
  return new Date(`${month}-01T00:00:00${EL_SALVADOR_OFFSET}`);
}

function nextMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function buildReportTools(ctx: AgentToolContext) {
  return {
    generate_monthly_report: defineTool({
      description:
        'Prepares the monthly billboard report of a contract, the exact PDF of the Reportes module ("Generar reporte"): cover, summary, one page per billboard of the contract with its most recent photo of the month, and closing pages about VEO. Use it for "reporte mensual", "reporte de vallas", "reporte del contrato X" or "reporte de la valla X". Search by contract number, client name or billboard code. The chat shows one card per matching contract with buttons to download it or send it to the client; never write those buttons or links in your reply. The report always has one photo per billboard; if the user asks for several photos, say so. Never build this report with create_pdf_document.',
      inputSchema: z.object({
        month: z
          .string()
          .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Usa el formato YYYY-MM')
          .describe('Month to report on (YYYY-MM)'),
        search: z
          .string()
          .min(2)
          .max(80)
          .describe(
            'Contract number, client name or billboard code, e.g. "VS-2077" or "CON0452/26"',
          ),
      }),
      execute: async ({ month, search }) => {
        if (!hasScope(ctx.user, 'contracts')) return unauthorized('contracts');

        const response = await ctx.api.request<{
          data: ActiveContractGroup[];
          total: number;
        }>({
          method: 'GET',
          path: '/contracts/active',
          query: {
            from: monthStart(month).toISOString(),
            to: monthStart(nextMonth(month)).toISOString(),
            search: search.trim(),
            pageSize: MAX_CONTRACTS,
          },
        });
        if (!response.ok) return { ok: false as const, error: response.error };

        const groups = response.data?.data ?? [];
        return {
          ok: true as const,
          month,
          search,
          total: response.data?.total ?? groups.length,
          ...(groups.length === 0 && {
            note: 'No active contract matches this search for the month, so no report was generated. Tell the user plainly and suggest checking the code, the contract number or another month.',
          }),
          contracts: groups.map((group) => ({
            contractNumber: group.contractNumber,
            customerName: group.customerName,
            customerEmail: group.customerEmail,
            description: group.description,
            endDate: group.endDate,
            totalBillboards: group.totalBillboards,
            billboardsWithImages: group.billboardsWithImages,
            totalImages: group.totalImages,
            reportsSendedCount: group.reportsSendedCount,
            billboardCodes: group.billboards
              .map((b) => b.billboardCode)
              .filter(Boolean)
              .slice(0, MAX_CODES),
          })),
        };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),
  };
}
