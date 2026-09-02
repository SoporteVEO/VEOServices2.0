"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  useMaintenanceCategories,
  useMaintenanceJobs,
} from "@/api/maintenance/maintenance.get";
import type {
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
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_ORDER,
} from "./maintenance-const";
import { MaintenanceJobDetailDrawer } from "./maintenance-job-detail-drawer";
import { MaintenanceJobFormDialog } from "./maintenance-job-form-dialog";
import { MAINTENANCE_JOBS_COLUMNS } from "./maintenance-jobs-columns";

const DEFAULT_PAGE_SIZE = 20;
const ALL = "ALL";

export function MaintenanceJobsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MaintenanceJobStatus | typeof ALL>(ALL);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<MaintenanceJobListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const { data: categories = [] } = useMaintenanceCategories();

  const { data, isLoading } = useMaintenanceJobs({
    search: debouncedSearch || undefined,
    status: status === ALL ? undefined : status,
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
        columns={MAINTENANCE_JOBS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por orden, valla o problema..."
        onRowClick={setSelected}
        emptyMessage="No hay órdenes de mantenimiento."
        sideButtons={
          <div className="flex flex-wrap items-center gap-2">
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

            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              Nueva orden
            </Button>
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

      <MaintenanceJobFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
