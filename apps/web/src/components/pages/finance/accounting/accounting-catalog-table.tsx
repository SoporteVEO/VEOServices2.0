"use client";

import { useState } from "react";
import { useAccounts, useCostCenters } from "@/api/finance/accounting.get";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useFinancePaging } from "../shared/use-finance-paging";
import { ACCOUNT_COLUMNS, COST_CENTER_COLUMNS } from "./accounting-columns";

function useCatalogFilters() {
  const [search, setSearch] = useState("");
  const paging = useFinancePaging(50);
  const debounced = useDebouncedValue(search.trim(), 300);
  const isCode = /^[\d.-]+$/.test(debounced);
  return {
    search,
    paging,
    onSearchChange: (value: string) => {
      setSearch(value);
      paging.reset();
    },
    query: {
      code: isCode ? debounced : undefined,
      name: !isCode && debounced ? debounced : undefined,
      page: paging.page,
      pageSize: paging.pageSize,
    },
  };
}

export function AccountingAccountsTable() {
  const filters = useCatalogFilters();
  const { data, isLoading, isFetching } = useAccounts(filters.query);

  return (
    <DataTable
      className="min-h-0 flex-1"
      columns={ACCOUNT_COLUMNS}
      data={data?.data ?? []}
      isLoading={isLoading || isFetching}
      searchValue={filters.search}
      onSearchChange={filters.onSearchChange}
      searchPlaceholder="Buscar por código o nombre de cuenta..."
      emptyMessage="No se encontraron cuentas contables."
      manualPagination={filters.paging.pagination(data?.total ?? 0)}
    />
  );
}

export function AccountingCostCentersTable() {
  const filters = useCatalogFilters();
  const { data, isLoading, isFetching } = useCostCenters(filters.query);

  return (
    <DataTable
      className="min-h-0 flex-1"
      columns={COST_CENTER_COLUMNS}
      data={data?.data ?? []}
      isLoading={isLoading || isFetching}
      searchValue={filters.search}
      onSearchChange={filters.onSearchChange}
      searchPlaceholder="Buscar centro de costo..."
      emptyMessage="No se encontraron centros de costo."
      manualPagination={filters.paging.pagination(data?.total ?? 0)}
    />
  );
}
