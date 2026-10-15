"use client";

import { useState } from "react";
import { useCrmClients } from "@/api/crm/crm.get";
import type { CrmClientRow } from "@/api/crm/crm.types";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CrmClientDrawer } from "./crm-client-drawer";
import { CRM_CLIENTS_COLUMNS } from "./crm-clients-columns";

const DEFAULT_PAGE_SIZE = 25;

export function CrmClientsPage() {
  const [search, setSearch] = useState("");
  const [withOpenDeals, setWithOpenDeals] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<CrmClientRow | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useCrmClients({
    search: debouncedSearch || undefined,
    withOpenDeals: withOpenDeals || undefined,
    page: pageIndex + 1,
    pageSize,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        className="min-h-0 flex-1"
        columns={CRM_CLIENTS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar cliente o empresa..."
        emptyMessage="No se encontraron clientes."
        onRowClick={setSelected}
        sideButtons={
          <div className="flex items-center gap-2">
            <Switch
              id="crm-clients-open-deals"
              checked={withOpenDeals}
              onCheckedChange={(checked) => {
                setWithOpenDeals(checked);
                setPageIndex(0);
              }}
            />
            <Label htmlFor="crm-clients-open-deals" className="text-sm">
              Solo con negocios abiertos
            </Label>
          </div>
        }
        manualPagination={{
          pageIndex,
          pageSize,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPageIndex(0);
          },
        }}
      />

      <CrmClientDrawer
        clientId={selected?.id ?? null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
