"use client";

import { useState } from "react";
import { useProductionOrders } from "@/api/production-orders/production-orders.get";
import type { ProductionOrder } from "@/api/production-orders/production-orders.types";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MyProductionOrderDetailDrawer } from "./my-production-order-detail-drawer";
import { MY_PRODUCTION_ORDERS_COLUMNS } from "./my-production-orders-columns";
import {
  MY_PRODUCTION_ORDERS_DEFAULT_PAGE_SIZE,
  MY_PRODUCTION_ORDERS_EMPTY_MESSAGE,
  MY_PRODUCTION_ORDERS_SEARCH_PLACEHOLDER,
} from "./const";
import { useMySpaceViewAs } from "./my-space-view-as-context";

export function MyProductionOrdersTable() {
  const { viewAsUserId } = useMySpaceViewAs();
  const readOnly = Boolean(viewAsUserId);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(
    MY_PRODUCTION_ORDERS_DEFAULT_PAGE_SIZE,
  );
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading } = useProductionOrders("mine", {
    page: pageIndex + 1,
    pageSize,
    search: debouncedSearch || undefined,
    viewAsUserId,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPageIndex(0);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={MY_PRODUCTION_ORDERS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={MY_PRODUCTION_ORDERS_SEARCH_PLACEHOLDER}
        emptyMessage={MY_PRODUCTION_ORDERS_EMPTY_MESSAGE}
        onRowClick={setSelectedOrder}
        manualPagination={{
          pageIndex,
          pageSize,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: handlePageSizeChange,
        }}
      />

      <MyProductionOrderDetailDrawer
        orderId={selectedOrder?.id ?? null}
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
        readOnly={readOnly}
      />
    </div>
  );
}
