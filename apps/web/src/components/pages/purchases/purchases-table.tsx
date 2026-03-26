"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { PurchaseRow } from "@/api/purchases/purchases.types";
import { Badge } from "@/components/primitives/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatDate, formatMoney } from "@/lib/format";
import { purchaseTotal, statusBadge } from "./const";
import { PurchaseDetailDrawer } from "./purchase-detail-drawer";
import { useState } from "react";

const columns: ColumnDef<PurchaseRow>[] = [
  {
    accessorKey: "createdAt",
    header: "Fecha",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "customerEmail",
    header: "Cliente",
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const badge = statusBadge[row.original.status] ?? statusBadge.PENDING;
      return <Badge variant={badge.variant}>{badge.label}</Badge>;
    },
  },
  {
    id: "itemCount",
    header: "Items",
    cell: ({ row }) => row.original.items.length,
  },
  {
    id: "total",
    header: () => <span className="block w-full">Total</span>,
    cell: ({ row }) => (
      <div className="font-medium tabular-nums">
        {formatMoney(purchaseTotal(row.original))}
      </div>
    ),
  },
];

export function PurchasesTable({
  purchases,
  isLoading = false,
}: {
  purchases: PurchaseRow[];
  isLoading?: boolean;
}) {
  const [selected, setSelected] = useState<PurchaseRow | null>(null);

  return (
    <>
      <DataTable
        columns={columns}
        data={purchases}
        isLoading={isLoading}
        skeletonRowCount={5}
        onRowClick={setSelected}
        emptyMessage="No hay compras."
      />

      <PurchaseDetailDrawer
        purchase={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
