"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Client, ClientType } from "@/api/clients/clients.types";
import { useClientsPaginated } from "@/api/clients/clients.get";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ClientDetailDrawer } from "./client-detail-drawer";
import { ClientFormDialog } from "./client-form-dialog";
import { CLIENTS_COLUMNS } from "./clients-columns";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_ORDER,
  CLIENTS_DEFAULT_PAGE_SIZE,
  CLIENTS_EMPTY_MESSAGE,
  CLIENTS_SEARCH_PLACEHOLDER,
} from "./const";

const ALL = "ALL";

export function ClientsTable() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<ClientType | typeof ALL>(ALL);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(CLIENTS_DEFAULT_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useClientsPaginated({
    search: debouncedSearch || undefined,
    type: type === ALL ? undefined : type,
    page: pageIndex + 1,
    pageSize,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handleTypeChange(value: string) {
    setType(value as ClientType | typeof ALL);
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
        sideButtons={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los tipos</SelectItem>
                {CLIENT_TYPE_ORDER.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CLIENT_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              Nuevo cliente
            </Button>
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

      <ClientDetailDrawer
        clientId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />

      <ClientFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
