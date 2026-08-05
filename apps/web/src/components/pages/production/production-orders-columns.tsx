"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ProductionOrder } from "@/api/production-orders/production-orders.types";
import { Badge } from "@/components/primitives/ui/badge";
import { ProductionOrderStatusBadge } from "@/components/pages/production-orders-shared/production-order-status-badge";
import { formatBriloShortDate } from "@/lib/format";

function summarizeCounts(order: ProductionOrder): string {
  const parts: string[] = [];
  if (order.statusCounts.COMPLETED > 0)
    parts.push(`${order.statusCounts.COMPLETED} completadas`);
  if (order.statusCounts.IN_PRODUCTION > 0)
    parts.push(`${order.statusCounts.IN_PRODUCTION} en producción`);
  if (order.statusCounts.RECEIVED > 0)
    parts.push(`${order.statusCounts.RECEIVED} recibidas`);
  if (order.statusCounts.CANCELLED > 0)
    parts.push(`${order.statusCounts.CANCELLED} canceladas`);
  return parts.join(" · ") || "—";
}

export const PRODUCTION_ORDERS_COLUMNS: ColumnDef<ProductionOrder>[] = [
  {
    accessorKey: "offerNumber",
    header: "Cotización",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.offerNumber}</span>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Campaña / Cliente",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate">
          {row.original.customerCompany ?? row.original.customerName}
        </p>
        {row.original.customerCompany ? (
          <p className="truncate text-xs text-muted-foreground">
            {row.original.customerName}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    id: "advisor",
    header: "Asesor",
    cell: ({ row }) => (
      <span className="truncate text-xs">
        {row.original.advisorFullName ?? "—"}
      </span>
    ),
  },
  {
    id: "itemCount",
    header: "Vallas",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono">
        {row.original.itemCount}
      </Badge>
    ),
  },
  {
    id: "breakdown",
    header: "Distribución",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {summarizeCounts(row.original)}
      </span>
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
    accessorKey: "createdAt",
    header: "Creada",
    cell: ({ row }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {formatBriloShortDate(row.original.createdAt)}
      </span>
    ),
  },
];
