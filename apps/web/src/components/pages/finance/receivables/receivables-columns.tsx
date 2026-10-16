"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type {
  AbonoFacturaConsulta,
  DetalleCxc,
  LimiteCredito,
  SaldoCxcCliente,
} from "@/api/finance/finance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatBriloShortDate, parseBriloDate } from "@/lib/format";
import { formatAmount } from "../shared/finance-format";

const amountCell = (value: number | null | undefined) => (
  <span className="font-medium tabular-nums">{formatAmount(value)}</span>
);

export const BALANCE_COLUMNS: ColumnDef<SaldoCxcCliente>[] = [
  {
    accessorKey: "cliNumero",
    header: "Código",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.cliNumero ?? "—"}</span>
    ),
  },
  {
    accessorKey: "nomCliente",
    header: "Cliente",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.nomCliente ?? "—"}</span>
    ),
  },
  {
    id: "documents",
    header: "Documentos",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.detFacturas?.length ?? 0}
      </span>
    ),
  },
  {
    id: "overdue",
    header: "Vencido",
    cell: ({ row }) => {
      const overdue = overdueAmount(row.original.detFacturas ?? []);
      return overdue > 0 ? (
        <span className="font-medium tabular-nums text-destructive">
          {formatAmount(overdue)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "saldo",
    header: "Saldo",
    cell: ({ row }) => amountCell(row.original.saldo),
  },
];

export function isOverdue(doc: DetalleCxc): boolean {
  const due = parseBriloDate(doc.dccFechaVence);
  return !!due && due.getTime() < Date.now() && doc.saldo > 0;
}

export function overdueAmount(docs: DetalleCxc[]): number {
  return docs.filter(isOverdue).reduce((sum, doc) => sum + doc.saldo, 0);
}

export function receivableDocColumns(
  actions?: (doc: DetalleCxc) => React.ReactNode,
): ColumnDef<DetalleCxc>[] {
  const columns: ColumnDef<DetalleCxc>[] = [
    {
      accessorKey: "mfaNumDoc",
      header: "Documento",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.mfaNumDoc}</span>
      ),
    },
    {
      accessorKey: "mfaFecha",
      header: "Emisión",
      cell: ({ row }) => formatBriloShortDate(row.original.mfaFecha),
    },
    {
      accessorKey: "dccFechaVence",
      header: "Vence",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {formatBriloShortDate(row.original.dccFechaVence)}
          {isOverdue(row.original) ? (
            <Badge variant="destructive">Vencido</Badge>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "saldo",
      header: "Saldo",
      cell: ({ row }) => amountCell(row.original.saldo),
    },
  ];
  if (actions) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => actions(row.original),
    });
  }
  return columns;
}

export const INVOICE_PAYMENT_COLUMNS: ColumnDef<AbonoFacturaConsulta>[] = [
  {
    accessorKey: "fecha_Abono",
    header: "Fecha",
    cell: ({ row }) => formatBriloShortDate(row.original.fecha_Abono),
  },
  {
    accessorKey: "cod_Cliente",
    header: "Cliente",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.cod_Cliente ?? "—"}</span>
    ),
  },
  {
    id: "invoice",
    header: "Factura",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {[row.original.tipo_Doc_Factura, row.original.num_Doc_Factura]
          .filter(Boolean)
          .join(" ")}
      </span>
    ),
  },
  {
    id: "payment",
    header: "Abono",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {[row.original.tipo_Abono, row.original.numero_Abono]
          .filter(Boolean)
          .join(" ")}
      </span>
    ),
  },
  {
    accessorKey: "concepto",
    header: "Concepto",
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-xs text-xs">
        {row.original.concepto ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "valor_Abono",
    header: "Valor",
    cell: ({ row }) => amountCell(row.original.valor_Abono),
  },
];

export const CREDIT_LIMIT_COLUMNS: ColumnDef<LimiteCredito>[] = [
  {
    accessorKey: "cliNumero",
    header: "Cliente",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.cliNumero ?? "—"}</span>
    ),
  },
  {
    accessorKey: "lmcrcMontoLimite",
    header: "Límite de crédito",
    cell: ({ row }) => amountCell(row.original.lmcrcMontoLimite),
  },
  {
    accessorKey: "cliPlazoCredito",
    header: "Plazo",
    cell: ({ row }) => `${row.original.cliPlazoCredito ?? 0} días`,
  },
];
