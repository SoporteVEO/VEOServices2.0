"use client";

import { type ReactNode, useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { DataTable } from "@/components/ui/data-table";
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
];

export function StaticBillboardsTable({
  billboards,
  isLoading = false,
  sideButtons,
}: {
  billboards: AvailableBillboardListing[];
  isLoading?: boolean;
  sideButtons?: ReactNode;
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

  return (
    <DataTable
      columns={columns}
      data={filtered}
      isLoading={isLoading}
      emptyMessage="No hay vallas disponibles."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar vallas..."
      sideButtons={sideButtons}
    />
  );
}
