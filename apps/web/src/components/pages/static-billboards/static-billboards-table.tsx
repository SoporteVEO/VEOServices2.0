"use client";

import { type ReactNode, useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/primitives/ui/badge";
import { formatMoney } from "@/lib/format";

const columns: ColumnDef<AvailableBillboardListing>[] = [
  {
    accessorKey: "billboardCode",
    header: "Código",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.billboardCode ?? "—"}</span>
    ),
  },
  {
    accessorKey: "cityName",
    header: "Ubicación",
    cell: ({ row }) => {
      const parts = [row.original.cityName, row.original.departmentName].filter(
        Boolean,
      );
      return (
        <span className="block max-w-[200px] truncate">
          {parts.length > 0 ? parts.join(", ") : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Dirección",
    cell: ({ row }) => (
      <span className="block max-w-[200px] truncate">
        {row.original.address ?? "—"}
      </span>
    ),
  },
  {
    id: "dimensions",
    header: "Dimensiones",
    cell: ({ row }) => {
      const { width, height } = row.original;
      if (width == null && height == null) return "—";
      return (
        <span className="tabular-nums">
          {width ?? "—"} × {height ?? "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "price",
    header: () => <span className="text-right block">Precio</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {formatMoney(row.original.price)}
      </span>
    ),
  },
  {
    accessorKey: "monthsWithoutPurchase",
    header: () => <span className="text-right block">Meses sin compra</span>,
    cell: ({ row }) => {
      const months = row.original.monthsWithoutPurchase;
      if (months == null) return null;
      return <span className="block text-right tabular-nums">{months}</span>;
    },
  },
  {
    accessorKey: "availableDiscount",
    header: () => <span className="text-right block">Descuento</span>,
    cell: ({ row }) => {
      const discount = row.original.availableDiscount;
      if (discount == null || discount === 0) {
        return null;
      }
      return (
        <div className="flex justify-end">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-transparent tabular-nums">
            -{discount}%
          </Badge>
        </div>
      );
    },
  },
];

export type StaticBillboardsSideButtonsContext = {
  filtered: AvailableBillboardListing[];
};

export function StaticBillboardsTable({
  billboards,
  isLoading = false,
  sideButtons,
}: {
  billboards: AvailableBillboardListing[];
  isLoading?: boolean;
  sideButtons?:
    | ReactNode
    | ((ctx: StaticBillboardsSideButtonsContext) => ReactNode);
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return billboards;
    const q = search.toLowerCase();
    return billboards.filter(
      (b) =>
        b.billboardCode?.toLowerCase().includes(q) ||
        b.reference?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q) ||
        b.cityName?.toLowerCase().includes(q) ||
        b.departmentName?.toLowerCase().includes(q),
    );
  }, [billboards, search]);

  const resolvedSideButtons =
    typeof sideButtons === "function"
      ? sideButtons({ filtered })
      : sideButtons;

  return (
    <DataTable
      columns={columns}
      data={filtered}
      isLoading={isLoading}
      emptyMessage="No hay vallas disponibles."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar vallas..."
      sideButtons={resolvedSideButtons}
    />
  );
}
