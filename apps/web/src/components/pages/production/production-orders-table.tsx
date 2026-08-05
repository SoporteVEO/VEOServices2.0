"use client";

import { useState } from "react";
import { useProductionOrders } from "@/api/production-orders/production-orders.get";
import type {
  ProductionOrder,
  ProductionOrderStatus,
} from "@/api/production-orders/production-orders.types";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCTION_STATUS_LABELS } from "@/components/pages/production-orders-shared/production-order-status-badge";
import { PRODUCTION_ORDERS_COLUMNS } from "./production-orders-columns";
import { ProductionOrderDetailDrawer } from "./production-order-detail-drawer";

const DEFAULT_PAGE_SIZE = 25;

type StatusFilter = "ALL" | ProductionOrderStatus;

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Todos los estados" },
  { value: "RECEIVED", label: PRODUCTION_STATUS_LABELS.RECEIVED },
  { value: "IN_PRODUCTION", label: PRODUCTION_STATUS_LABELS.IN_PRODUCTION },
  { value: "COMPLETED", label: PRODUCTION_STATUS_LABELS.COMPLETED },
  { value: "CANCELLED", label: PRODUCTION_STATUS_LABELS.CANCELLED },
];

export function ProductionOrdersTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading } = useProductionOrders("all", {
    page: pageIndex + 1,
    pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPageIndex(0);
  }

  function handleStatusFilterChange(next: string) {
    setStatusFilter(next as StatusFilter);
    setPageIndex(0);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={PRODUCTION_ORDERS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por cotización, cliente o empresa..."
        emptyMessage="No hay órdenes de producción con estos filtros."
        onRowClick={setSelectedOrder}
        sideButtons={
          <div className="min-w-[180px]">
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        manualPagination={{
          pageIndex,
          pageSize,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: handlePageSizeChange,
        }}
      />

      <ProductionOrderDetailDrawer
        orderId={selectedOrder?.id ?? null}
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      />
    </div>
  );
}
