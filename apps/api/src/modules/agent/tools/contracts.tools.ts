import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import {
  type AgentToolContext,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface ExpiringContract {
  contractNumber: string;
  customerName: string;
  customerEmail: string | null;
  sellerName: string | null;
  endDate: string;
  totalBillboards: number;
  billboardCodes: string[];
}

interface ExpiringContractsResponse {
  data: ExpiringContract[];
  total: number;
  truncated: boolean;
}

const COLUMNS = [
  { key: 'vence', label: 'Vence', format: 'date' },
  { key: 'contrato', label: 'Contrato', format: 'text' },
  { key: 'cliente', label: 'Cliente', format: 'text' },
  { key: 'vendedor', label: 'Vendedor', format: 'text' },
  { key: 'vallas', label: 'Vallas', format: 'number' },
  { key: 'codigos', label: 'Códigos de valla', format: 'text' },
  { key: 'correo', label: 'Correo del cliente', format: 'text' },
] as const;

function summarizeBySeller(contracts: ExpiringContract[]) {
  const bySeller = new Map<string, { contracts: number; billboards: number }>();
  for (const contract of contracts) {
    const seller = contract.sellerName ?? 'Sin vendedor';
    const current = bySeller.get(seller) ?? { contracts: 0, billboards: 0 };
    current.contracts += 1;
    current.billboards += contract.totalBillboards;
    bySeller.set(seller, current);
  }
  return Array.from(bySeller, ([seller, counts]) => ({ seller, ...counts }));
}

export function buildContractTools(ctx: AgentToolContext) {
  return {
    list_expiring_contracts: defineTool({
      description:
        'Lists the contracts whose end date falls between two dates (both inclusive), optionally for one seller, and shows them in the chat as a complete table built by the server, with export buttons. Use it for "contratos por vencer", "renovaciones", "contratos que vencen en diciembre" or a seller\'s renewals. Do not rebuild or repeat the table with show_table. Never use /contracts/ending-soon or the contracts worker endpoints for this.',
      inputSchema: z.object({
        from: z
          .string()
          .regex(DATE_PATTERN, 'Usa el formato YYYY-MM-DD')
          .describe('First end date to include (YYYY-MM-DD)'),
        to: z
          .string()
          .regex(DATE_PATTERN, 'Usa el formato YYYY-MM-DD')
          .describe('Last end date to include (YYYY-MM-DD)'),
        seller: z
          .string()
          .min(2)
          .max(80)
          .optional()
          .describe(
            'Seller (executive) name, e.g. "Marta Descamps". Omit it to include every seller.',
          ),
      }),
      execute: async ({ from, to, seller }) => {
        if (!hasScope(ctx.user, 'contracts')) return unauthorized('contracts');

        const response = await ctx.api.request<ExpiringContractsResponse>({
          method: 'GET',
          path: '/contracts/expiring',
          query: { from, to, seller },
        });
        if (!response.ok) return { ok: false as const, error: response.error };

        const contracts = response.data?.data ?? [];
        const totalBillboards = contracts.reduce(
          (sum, contract) => sum + contract.totalBillboards,
          0,
        );

        return {
          ok: true as const,
          title: seller
            ? `Contratos de ${seller} que vencen del ${from} al ${to}`
            : `Contratos que vencen del ${from} al ${to}`,
          description:
            'Fecha de fin del contrato, vendedor (creador del contrato) y vallas.',
          columns: COLUMNS,
          rows: contracts.map((contract) => ({
            vence: contract.endDate.slice(0, 10),
            contrato: contract.contractNumber,
            cliente: contract.customerName,
            vendedor: contract.sellerName ?? 'Sin vendedor',
            vallas: contract.totalBillboards,
            codigos: contract.billboardCodes.join(', '),
            correo: contract.customerEmail ?? 'Sin correo registrado',
          })),
          from,
          to,
          seller: seller ?? null,
          total: response.data?.total ?? contracts.length,
          totalBillboards,
          truncated: response.data?.truncated ?? false,
          bySeller: summarizeBySeller(contracts),
        };
      },
      toModelOutput: ({ output }) => {
        if (!output.ok || !('rows' in output)) return toModelText(output);
        return toModelText({
          from: output.from,
          to: output.to,
          seller: output.seller,
          total: output.total,
          totalBillboards: output.totalBillboards,
          truncated: output.truncated,
          bySeller: output.bySeller,
          note: 'The full table is already shown to the user in the chat. Do not repeat its rows or rebuild it; reply with a short summary using these figures.',
        });
      },
    }),
  };
}
