"use client";

import { useState } from "react";
import type { Client } from "@/api/clients/clients.types";
import { useClientsPaginated } from "@/api/clients/clients.get";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ClientDetailDrawer } from "./client-detail-drawer";
import { CLIENTS_COLUMNS } from "./clients-columns";
import {
  CLIENTS_DEFAULT_PAGE_SIZE,
  CLIENTS_EMPTY_MESSAGE,
  CLIENTS_SEARCH_PLACEHOLDER,
} from "./const";

export function ClientsTable() {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(CLIENTS_DEFAULT_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useClientsPaginated({
    search: debouncedSearch || undefined,
    page: pageIndex + 1,
    pageSize,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPageIndex(0);
  }

  function handleRowClick(client: Client) {
    setSelectedId(client.id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        className="min-h-0 flex-1"
        columns={CLIENTS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={CLIENTS_SEARCH_PLACEHOLDER}
        emptyMessage={CLIENTS_EMPTY_MESSAGE}
        onRowClick={handleRowClick}
        manualPagination={{
          pageIndex,
          pageSize,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: handlePageSizeChange,
        }}
      />

      <ClientDetailDrawer
        clientId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
