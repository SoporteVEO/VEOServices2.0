"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ClientType } from "@/api/clients/clients.types";
import { useCrmClients } from "@/api/crm/crm.get";
import { ClientFormDialog } from "@/components/pages/clients/client-form-dialog";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_ORDER,
} from "@/components/pages/clients/const";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
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
import { CrmClientDrawer } from "./crm-client-drawer";
import { CRM_CLIENTS_COLUMNS } from "./crm-clients-columns";

const DEFAULT_PAGE_SIZE = 25;
const ALL = "ALL";

export function CrmClientsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<ClientType | typeof ALL>(ALL);
  const [withOpenDeals, setWithOpenDeals] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useCrmClients({
    search: debouncedSearch || undefined,
    type: type === ALL ? undefined : type,
    withOpenDeals: withOpenDeals || undefined,
    page: pageIndex + 1,
    pageSize,
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-0 flex-col">
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
        onRowClick={(row) => setSelectedId(row.id)}
        sideButtons={
          <div className="flex flex-wrap items-center gap-3">
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
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as ClientType | typeof ALL);
                setPageIndex(0);
              }}
            >
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
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPageIndex(0);
          },
        }}
      />

      <CrmClientDrawer
        clientId={selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />

      <ClientFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(client) => setSelectedId(client.id)}
      />
    </div>
  );
}
