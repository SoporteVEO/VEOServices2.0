"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type {
  DetalleFactura,
  Factura,
  OdfListItem,
} from "@/api/finance/finance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatBriloShortDate } from "@/lib/format";
import { formatAmount } from "../shared/finance-format";
import { FinanceStatusBadge } from "../shared/finance-status-badge";

const amountCell = (value: number | null | undefined) => (
  <span className="font-medium tabular-nums">{formatAmount(value)}</span>
);

export function invoiceClientName(invoice: Factura): string {
  return (
    [invoice.mfaNomCliente, invoice.mfaApeCliente].filter(Boolean).join(" ") ||
    "—"
  );
}

export const INVOICE_COLUMNS: ColumnDef<Factura>[] = [
  {
    id: "document",
    header: "Documento",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline">{row.original.mfaTipoDoc ?? "—"}</Badge>
        <span className="font-mono text-xs">{row.original.mfaNumDoc}</span>
      </div>
    ),
  },
  {
    accessorKey: "mfaFecha",
    header: "Fecha",
    cell: ({ row }) => formatBriloShortDate(row.original.mfaFecha),
  },
  {
    id: "client",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="min-w-0 max-w-xs">
        <p className="truncate font-medium">
          {invoiceClientName(row.original)}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {row.original.cliNumero}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "mfaGranTotal",
    header: "Total",
    cell: ({ row }) => amountCell(row.original.mfaGranTotal),
  },
  {
    accessorKey: "saldoFactura",
    header: "Saldo",
    cell: ({ row }) => {
      const balance = row.original.saldoFactura ?? 0;
      return balance > 0 ? (
        amountCell(balance)
      ) : (
        <Badge variant="success">Pagada</Badge>
      );
    },
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => (
      <FinanceStatusBadge
        annulled={row.original.mfaAnulada}
        posted={row.original.mfaPosteada}
        finalized={row.original.mfaFinalizada}
      />
    ),
  },
];

export const ORDER_COLUMNS: ColumnDef<OdfListItem>[] = [
  {
    id: "document",
    header: "Documento",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline">{row.original.mfaTipoDoc ?? "—"}</Badge>
        <span className="font-mono text-xs">{row.original.mfaNumDoc}</span>
      </div>
    ),
  },
  {
    accessorKey: "mfaFecha",
    header: "Fecha",
    cell: ({ row }) => formatBriloShortDate(row.original.mfaFecha),
  },
  {
    id: "client",
    header: "Cliente / título",
    cell: ({ row }) => (
      <div className="min-w-0 max-w-sm">
        <p className="truncate font-medium">{row.original.cliNombre ?? "—"}</p>
        {row.original.mfaTitulo ? (
          <p className="truncate text-xs text-muted-foreground">
            {row.original.mfaTitulo}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "vndNombre",
    header: "Vendedor",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.vndNombre ?? "—"}</span>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => amountCell(row.original.total),
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => (
      <FinanceStatusBadge
        annulled={row.original.mfaAnulada}
        posted={row.original.mfaPosteada}
        finalized={row.original.mfaFinalizada}
      />
    ),
  },
];

export const INVOICE_LINE_COLUMNS: ColumnDef<DetalleFactura>[] = [
  {
    accessorKey: "dfaDescripcion",
    header: "Descripción",
    cell: ({ row }) => (
      <div className="min-w-0 max-w-xs">
        <p className="line-clamp-2 text-xs">{row.original.dfaDescripcion}</p>
        {row.original.proCodigo ? (
          <p className="font-mono text-[11px] text-muted-foreground">
            {row.original.proCodigo}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "dfaCantidad",
    header: "Cant.",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.dfaCantidad}</span>
    ),
  },
  {
    accessorKey: "dfaPrecio",
    header: "Precio",
    cell: ({ row }) => amountCell(row.original.dfaPrecio),
  },
  {
    accessorKey: "dfaTotalLinea",
    header: "Total",
    cell: ({ row }) => amountCell(row.original.dfaTotalLinea),
  },
];
