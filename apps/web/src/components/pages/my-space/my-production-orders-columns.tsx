"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ProductionOrder } from "@/api/production-orders/production-orders.types";
import { Badge } from "@/components/primitives/ui/badge";
import { ProductionOrderPrintDateCell } from "@/components/pages/production-orders-shared/production-order-print-date-cell";
import { ProductionOrderStatusBadge } from "@/components/pages/production-orders-shared/production-order-status-badge";

export const MY_PRODUCTION_ORDERS_COLUMNS: ColumnDef<ProductionOrder>[] = [
  {
    accessorKey: "orderNumber",
    header: "Orden",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.orderNumber}</span>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate">{row.original.customerName}</p>
        {row.original.customerCompany ? (
          <p className="truncate text-xs text-muted-foreground">
            {row.original.customerCompany}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    id: "itemCount",
    header: "Vallas estáticas",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono">
        {row.original.itemCount}
      </Badge>
    ),
  },
  {
    id: "aggregateStatus",
    header: "Estado general",
    cell: ({ row }) => (
      <ProductionOrderStatusBadge status={row.original.aggregateStatus} />
    ),
  },
  {
    id: "printDate",
    header: "Fecha de impresión",
    cell: ({ row }) => <ProductionOrderPrintDateCell order={row.original} />,
  },
];
