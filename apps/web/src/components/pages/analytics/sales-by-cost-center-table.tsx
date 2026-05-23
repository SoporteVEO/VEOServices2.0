"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { SalesByCostCenterRow } from "@/api/analytics/analytics.types";
import { Badge } from "@/components/primitives/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";

function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const DOC_TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CCF: "default",
  FCF: "secondary",
  NDC: "destructive",
};

export function SalesByCostCenterTable({
  rows,
  isLoading,
  searchValue,
  onSearchChange,
  sideButtons,
}: {
  rows: SalesByCostCenterRow[];
  isLoading: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sideButtons?: React.ReactNode;
}) {
  const columns = useMemo<ColumnDef<SalesByCostCenterRow>[]>(
    () => [
      {
        accessorKey: "costCenterName",
        header: "Centro de Costos (Detalle)",
        cell: ({ row }) => (
          <span className="line-clamp-1 text-muted-foreground">
            {row.original.costCenterName}
          </span>
        ),
      },
      {
        accessorKey: "subCostCenterName",
        header: "Sub Centro de Costos (Detalle)",
        cell: ({ row }) => (
          <span className="line-clamp-1 text-muted-foreground">
            {row.original.subCostCenterName ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "tipoVentaName",
        header: "Tipo de Venta",
        cell: ({ row }) => (
          <span className="line-clamp-1">{row.original.tipoVentaName}</span>
        ),
      },
      {
        accessorKey: "sellerName",
        header: "Vendedor",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.sellerName}</span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Cliente",
        cell: ({ row }) => (
          <span className="line-clamp-1">{row.original.customerName}</span>
        ),
      },
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="tabular-nums">{formatDate(row.original.date)}</span>
        ),
      },
      {
        accessorKey: "documentType",
        header: "Tipo",
        cell: ({ row }) => {
          const variant =
            DOC_TYPE_VARIANT[row.original.documentType] ?? "outline";
          return (
            <Badge variant={variant} className="tabular-nums">
              {row.original.documentType}
            </Badge>
          );
        },
      },
      {
        accessorKey: "guid",
        header: "Num. Documento",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.guid || row.original.documentNumber || "—"}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: () => (
          <div className="text-right">Monto con IVA + Impuestos</div>
        ),
        cell: ({ row }) => (
          <div
            className={`text-right tabular-nums font-medium ${
              row.original.total < 0 ? "text-destructive" : ""
            }`}
          >
            {formatCurrency(row.original.total)}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      pagination={{ pageSize: 25 }}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar centro, tipo de venta, cliente, vendedor o documento..."
      emptyMessage="No hay ventas en el período seleccionado."
      sideButtons={sideButtons}
    />
  );
}
