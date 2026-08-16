import type {
  ProductionOrder,
  ProductionOrderItem,
  ProductionOrderStatus,
} from "@/api/production-orders/production-orders.types";

const STATUS_PRIORITY: ProductionOrderStatus[] = [
  "CANCELLED",
  "RECEIVED",
  "IN_PRODUCTION",
  "COMPLETED",
];

export function resolveAggregateStatus(
  statuses: ProductionOrderStatus[],
): ProductionOrderStatus {
  if (statuses.length === 0) return "RECEIVED";
  const set = new Set(statuses);
  for (const status of STATUS_PRIORITY) {
    if (set.has(status)) return status;
  }
  return statuses[0] ?? "RECEIVED";
}

export function sortProductionOrderItems(
  items: ProductionOrderItem[],
): ProductionOrderItem[] {
  return [...items].sort((a, b) => {
    const byCreatedAt = a.createdAt.localeCompare(b.createdAt);
    if (byCreatedAt !== 0) return byCreatedAt;
    return a.id.localeCompare(b.id);
  });
}

export function patchProductionOrderWithUpdatedItem(
  order: ProductionOrder,
  updatedItem: ProductionOrderItem,
): ProductionOrder {
  const items = sortProductionOrderItems(
    order.items.map((item) =>
      item.id === updatedItem.id ? updatedItem : item,
    ),
  );
  const statuses = items.map((item) => item.status);
  const statusCounts: Record<ProductionOrderStatus, number> = {
    RECEIVED: 0,
    IN_PRODUCTION: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const status of statuses) {
    statusCounts[status] += 1;
  }

  return {
    ...order,
    items,
    aggregateStatus: resolveAggregateStatus(statuses),
    statusCounts,
    updatedAt: updatedItem.updatedAt,
  };
}
