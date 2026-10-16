"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CuentaBanco } from "@/api/finance/finance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatBriloShortDate } from "@/lib/format";
import { formatAmount } from "../shared/finance-format";
import { FinanceStatusBadge } from "../shared/finance-status-badge";

/** Deposits (abn*) and charges (crg*) share a shape, normalized for one table. */
export interface BankMovementRow {
  id: number;
  number: string | null;
  date: string | null;
  bankDate?: string | null;
  account?: string | null;
  typeCode?: string | null;
  reason?: string | null;
  creditor?: string | null;
  amount: number;
  currency?: string | null;
  posted?: boolean;
  annulled?: boolean;
}

export function bankMovementColumns(
  kind: "deposits" | "charges",
  actions: (row: BankMovementRow) => React.ReactNode,
): ColumnDef<BankMovementRow>[] {
  const columns: ColumnDef<BankMovementRow>[] = [
    {
      accessorKey: "number",
      header: "Número",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.number ?? "—"}</span>
      ),
    },
    {
      accessorKey: "date",
      header: "Fecha",
      cell: ({ row }) => formatBriloShortDate(row.original.date),
    },
    {
      accessorKey: "account",
      header: "Cuenta",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.account ?? "—"}</span>
      ),
    },
    {
      accessorKey: "typeCode",
      header: "Tipo",
      cell: ({ row }) => row.original.typeCode ?? "—",
    },
    {
      accessorKey: "reason",
      header: kind === "charges" ? "Motivo / acreedor" : "Motivo",
      cell: ({ row }) => (
        <div className="min-w-0 max-w-sm">
          <p className="line-clamp-1">{row.original.reason ?? "—"}</p>
          {row.original.creditor ? (
            <p className="truncate text-xs text-muted-foreground">
              {row.original.creditor}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Monto",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatAmount(row.original.amount)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => (
        <FinanceStatusBadge
          annulled={row.original.annulled}
          posted={row.original.posted}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => actions(row.original),
    },
  ];
  return columns;
}

export const BANK_ACCOUNT_COLUMNS: ColumnDef<CuentaBanco>[] = [
  {
    accessorKey: "bcoCodigo",
    header: "Banco",
    cell: ({ row }) => row.original.bcoCodigo ?? "—",
  },
  {
    accessorKey: "bcuNumero",
    header: "Número de cuenta",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.bcuNumero}</span>
    ),
  },
  {
    accessorKey: "cueCodigo",
    header: "Cuenta contable",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.cueCodigo ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "monCodigo",
    header: "Moneda",
    cell: ({ row }) => row.original.monCodigo ?? "—",
  },
  {
    accessorKey: "sucCodigo",
    header: "Sucursal",
    cell: ({ row }) => row.original.sucCodigo ?? "—",
  },
  {
    id: "flags",
    header: "Estado",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.bcuActiva === false ? (
          <Badge variant="outline">Inactiva</Badge>
        ) : (
          <Badge variant="success">Activa</Badge>
        )}
        {row.original.bcuPreferida ? (
          <Badge variant="info">Preferida</Badge>
        ) : null}
      </div>
    ),
  },
];
