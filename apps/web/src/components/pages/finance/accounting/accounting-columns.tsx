"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type {
  CentroCosto,
  CuentaConta,
  DetallePartida,
  Partida,
} from "@/api/finance/finance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatBriloShortDate } from "@/lib/format";
import { formatAmount } from "../shared/finance-format";
import { FinanceStatusBadge } from "../shared/finance-status-badge";

export const ENTRY_COLUMNS: ColumnDef<Partida>[] = [
  {
    accessorKey: "mpaNumero",
    header: "Número",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.mpaNumero ?? "—"}</span>
    ),
  },
  {
    accessorKey: "mpaFecha",
    header: "Fecha",
    cell: ({ row }) => formatBriloShortDate(row.original.mpaFecha),
  },
  {
    accessorKey: "tpaNombre",
    header: "Tipo",
    cell: ({ row }) => row.original.tpaNombre ?? row.original.tpaCodigo ?? "—",
  },
  {
    accessorKey: "mpaDescripcion",
    header: "Descripción",
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-md">
        {row.original.mpaDescripcion ?? "—"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => (
      <FinanceStatusBadge
        annulled={row.original.mpaAnulada}
        posted={row.original.mpaPosteada}
      />
    ),
  },
];

export function entryLineColumns(
  actions?: (line: DetallePartida) => React.ReactNode,
): ColumnDef<DetallePartida>[] {
  const columns: ColumnDef<DetallePartida>[] = [
    {
      accessorKey: "cueCodigo",
      header: "Cuenta",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-mono text-xs">{row.original.cueCodigo}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.cueNombre}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "dpaDescripcion",
      header: "Concepto",
      cell: ({ row }) => (
        <span className="line-clamp-2 text-xs">
          {row.original.dpaDescripcion ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "dpaDebe",
      header: "Debe",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.dpaDebe ? formatAmount(row.original.dpaDebe) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "dpaHaber",
      header: "Haber",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.dpaHaber ? formatAmount(row.original.dpaHaber) : "—"}
        </span>
      ),
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

export const ACCOUNT_COLUMNS: ColumnDef<CuentaConta>[] = [
  {
    accessorKey: "cueCodigo",
    header: "Código",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.cueCodigo}</span>
    ),
  },
  { accessorKey: "cueNombre", header: "Nombre" },
  {
    accessorKey: "cueCodigoPadre",
    header: "Cuenta padre",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.cueCodigoPadre ?? "—"}
      </span>
    ),
  },
  {
    id: "flags",
    header: "Atributos",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.cueDetalle ? (
          <Badge variant="secondary">Detalle</Badge>
        ) : null}
        {row.original.cueReqCentroCosto ? (
          <Badge variant="info">Req. centro de costo</Badge>
        ) : null}
        {row.original.cueBloqueada ? (
          <Badge variant="destructive">Bloqueada</Badge>
        ) : null}
        {row.original.cueActiva === false ? (
          <Badge variant="outline">Inactiva</Badge>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "cueSaldo",
    header: "Saldo",
    cell: ({ row }) => (
      <span className="tabular-nums">{formatAmount(row.original.cueSaldo)}</span>
    ),
  },
];

export const COST_CENTER_COLUMNS: ColumnDef<CentroCosto>[] = [
  {
    accessorKey: "cecoCodigo",
    header: "Código",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.cecoCodigo}</span>
    ),
  },
  { accessorKey: "cecoNombre", header: "Nombre" },
  {
    accessorKey: "cecoCodigoPadre",
    header: "Centro padre",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.cecoCodigoPadre ?? "—"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) =>
      row.original.cecoActivo === false ? (
        <Badge variant="outline">Inactivo</Badge>
      ) : (
        <Badge variant="success">Activo</Badge>
      ),
  },
];
