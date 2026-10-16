"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  useMaintenanceCategories,
  useMaintenanceJobs,
} from "@/api/maintenance/maintenance.get";
import type {
  MaintenanceJobKind,
  MaintenanceJobListItem,
  MaintenanceJobStatus,
} from "@/api/maintenance/maintenance.types";
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
import {
  MAINTENANCE_KIND_COPY,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_ORDER,
} from "./maintenance-const";
import { MaintenanceJobDetailDrawer } from "./maintenance-job-detail-drawer";
import { MaintenanceJobFormDialog } from "./maintenance-job-form-dialog";
import { maintenanceJobsColumns } from "./maintenance-jobs-columns";

const DEFAULT_PAGE_SIZE = 20;
const ALL = "ALL";

type Props = {
  kind: MaintenanceJobKind;
  /** "open" is the working list; "closed" lists the Terminada jobs only. */
  view: "open" | "closed";
};

export function MaintenanceJobsTable({ kind, view }: Props) {
  const isClosedView = view === "closed";
  const copy = MAINTENANCE_KIND_COPY[kind];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MaintenanceJobStatus | typeof ALL>(ALL);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<MaintenanceJobListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const columns = useMemo(
    () => maintenanceJobsColumns(kind, view),
    [kind, view],
  );

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const { data: categories = [] } = useMaintenanceCategories(kind);

  const { data, isLoading } = useMaintenanceJobs({
    kind,
    search: debouncedSearch || undefined,
    status: isClosedView ? "CLOSED" : status === ALL ? undefined : status,
    categoryId: categoryId === ALL ? undefined : categoryId,
    page: pageIndex + 1,
    pageSize,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={copy.searchPlaceholder}
        onRowClick={setSelected}
        emptyMessage={
          isClosedView
            ? "No hay órdenes terminadas."
            : "No hay órdenes de mantenimiento."
        }
        sideButtons={
          <div className="flex flex-wrap items-center gap-2">
            {isClosedView ? null : (
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as MaintenanceJobStatus | typeof ALL);
                  setPageIndex(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos los estados</SelectItem>
                  {MAINTENANCE_STATUS_ORDER.map((value) => (
                    <SelectItem key={value} value={value}>
                      {MAINTENANCE_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isClosedView ? null : (
              <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                Nueva orden
              </Button>
            )}
          </div>
        }
        manualPagination={{
          pageIndex,
          pageSize,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: (next) => {
            setPageSize(next);
            setPageIndex(0);
          },
        }}
      />

      <MaintenanceJobDetailDrawer
        jobId={selected?.id ?? null}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />

      {isClosedView ? null : (
        <MaintenanceJobFormDialog
          kind={kind}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
    </div>
  );
}
