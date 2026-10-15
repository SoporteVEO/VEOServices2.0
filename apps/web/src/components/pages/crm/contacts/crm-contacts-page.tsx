"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCrmContacts } from "@/api/crm/crm.get";
import type { CrmContact } from "@/api/crm/crm.types";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CrmContactDrawer } from "./crm-contact-drawer";
import { CrmContactFormDialog } from "./crm-contact-form-dialog";
import { CRM_CONTACTS_COLUMNS } from "./crm-contacts-columns";

const DEFAULT_PAGE_SIZE = 25;

export function CrmContactsPage() {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<CrmContact | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useCrmContacts({
    search: debouncedSearch || undefined,
    page: pageIndex + 1,
    pageSize,
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-0 flex-col">
      <DataTable
        className="min-h-0 flex-1"
        columns={CRM_CONTACTS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar por nombre, correo, teléfono o cliente..."
        emptyMessage="Aún no hay contactos."
        onRowClick={setSelected}
        sideButtons={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Nuevo contacto
          </Button>
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

      <CrmContactDrawer
        contactId={selected?.id ?? null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
      <CrmContactFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
