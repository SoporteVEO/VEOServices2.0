"use client";

import { type ReactNode, useState, useMemo } from "react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/primitives/ui/badge";
import {
  MultiSelectFilter,
  type MultiSelectFilterOption,
} from "@/components/ui/multi-select-filter";
import { formatMoney } from "@/lib/format";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/primitives/ui/tooltip";
import { BillboardDetailDrawer } from "./detail";

const baseColumns: ColumnDef<AvailableBillboardListing>[] = [
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
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block max-w-[200px] truncate">
            {row.original.address ?? "—"}
          </span>
        </TooltipTrigger>
        <TooltipContent>{row.original.address ?? "—"}</TooltipContent>
      </Tooltip>
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
];

const discountColumn: ColumnDef<AvailableBillboardListing> = {
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
};

const availabilityColumn: ColumnDef<AvailableBillboardListing> = {
  accessorKey: "isAvailable",
  header: () => <span className="text-right block">Disponibilidad</span>,
  cell: ({ row }) => {
    const isAvailable = row.original.isAvailable;
    return (
      <div className="flex justify-end">
        <Badge
          className={
            isAvailable
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-transparent"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-transparent"
          }
        >
          {isAvailable ? "Disponible" : "Ocupada"}
        </Badge>
      </div>
    );
  },
};

export type StaticBillboardsSideButtonsContext = {
  filtered: AvailableBillboardListing[];
  selectedRows: AvailableBillboardListing[];
  clearSelection: () => void;
};

function getBillboardRowId(b: AvailableBillboardListing): string {
  return String(b.billboardId);
}

const UNKNOWN_DEPARTMENT = "__sin_departamento__";

function departmentKey(b: AvailableBillboardListing): string {
  return b.departmentName ?? UNKNOWN_DEPARTMENT;
}

/** Departments present in the current result set, with how many rows each holds. */
function buildDepartmentOptions(
  billboards: AvailableBillboardListing[],
): MultiSelectFilterOption[] {
  const counts = new Map<string, number>();
  for (const b of billboards) {
    const key = departmentKey(b);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: value === UNKNOWN_DEPARTMENT ? "Sin departamento" : value,
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
}

export function StaticBillboardsTable({
  billboards,
  isLoading = false,
  showAvailabilityColumn = false,
  enableRowSelection = false,
  sideButtons,
}: {
  billboards: AvailableBillboardListing[];
  isLoading?: boolean;
  showAvailabilityColumn?: boolean;
  enableRowSelection?: boolean;
  sideButtons?:
    | ReactNode
    | ((ctx: StaticBillboardsSideButtonsContext) => ReactNode);
}) {
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [selected, setSelected] = useState<AvailableBillboardListing | null>(
    null,
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(
    () =>
      showAvailabilityColumn
        ? [...baseColumns, availabilityColumn]
        : [...baseColumns, discountColumn],
    [showAvailabilityColumn],
  );

  const departmentOptions = useMemo(
    () => buildDepartmentOptions(billboards),
    [billboards],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const wanted = new Set(departments);

    return billboards.filter((b) => {
      if (wanted.size > 0 && !wanted.has(departmentKey(b))) return false;
      if (!q) return true;
      return Boolean(
        b.billboardCode?.toLowerCase().includes(q) ||
          b.reference?.toLowerCase().includes(q) ||
          b.address?.toLowerCase().includes(q) ||
          b.cityName?.toLowerCase().includes(q) ||
          b.departmentName?.toLowerCase().includes(q),
      );
    });
  }, [billboards, search, departments]);

  // Ticking a row means "include this billboard", so the selection survives
  // changing the filters. That is what lets a report cover, say, 3 vallas in
  // Ahuachapán and 5 in San Salvador without holding both in view at once.
  const selectedRows = useMemo(() => {
    if (!enableRowSelection) return [];
    return billboards.filter((b) => rowSelection[getBillboardRowId(b)]);
  }, [billboards, rowSelection, enableRowSelection]);

  const clearSelection = () => setRowSelection({});

  const resolvedSideButtons = (
    <>
      <MultiSelectFilter
        label="Departamento"
        options={departmentOptions}
        value={departments}
        onChange={setDepartments}
        disabled={isLoading}
        emptyLabel="Sin departamentos."
      />
      {typeof sideButtons === "function"
        ? sideButtons({ filtered, selectedRows, clearSelection })
        : sideButtons}
    </>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No hay vallas disponibles."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar vallas..."
        sideButtons={resolvedSideButtons}
        pagination={{ pageSize: 25 }}
        onRowClick={setSelected}
        rowSelection={
          enableRowSelection
            ? {
                state: rowSelection,
                onChange: setRowSelection,
                getRowId: getBillboardRowId,
              }
            : undefined
        }
      />
      <BillboardDetailDrawer
        billboard={selected}
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
