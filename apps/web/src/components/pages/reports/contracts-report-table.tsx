"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Image as ImageIcon, Mail, Monitor } from "lucide-react";
import { Badge } from "@/components/primitives/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatShortDate } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useActiveContracts,
  type ActiveContractGroup,
} from "@/api/contracts/contracts.get";
import { ContractReportDrawer } from "./contract-report-drawer";
import { REPORT_TYPE_CONFIG, type ReportType } from "./report-types";

const DEFAULT_PAGE_SIZE = 25;

interface ContractsReportTableProps {
  reportType: ReportType;
}

export function ContractsReportTable({
  reportType,
}: ContractsReportTableProps) {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<ActiveContractGroup | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const config = REPORT_TYPE_CONFIG[reportType];

  const { data, isLoading } = useActiveContracts({
    page: pageIndex + 1,
    pageSize,
    search: debouncedSearch || undefined,
    imageType: config.imageType,
  });

  const columns = useMemo<ColumnDef<ActiveContractGroup>[]>(
    () => [
      {
        accessorKey: "contractNumber",
        header: "Contrato",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.contractNumber}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Atención",
        cell: ({ row }) => row.original.description ?? "—",
      },
      {
        accessorKey: "customerName",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate">{row.original.customerName ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.customerEmail ?? "Sin correo"}
            </p>
          </div>
        ),
      },
      {
        id: "billboards",
        header: "Vallas",
        cell: ({ row }) => (
          <Badge variant="secondary" className="gap-1">
            <Monitor className="size-3" aria-hidden />
            {row.original.totalBillboards}
          </Badge>
        ),
      },
      {
        id: "images",
        header: "Imágenes",
        cell: ({ row }) => {
          const { billboardsWithImages, totalBillboards } = row.original;
          const isComplete =
            totalBillboards > 0 && billboardsWithImages === totalBillboards;
          return (
            <Badge
              variant={isComplete ? "default" : "secondary"}
              className="gap-1"
            >
              <ImageIcon className="size-3" aria-hidden />
              {billboardsWithImages} / {totalBillboards}
            </Badge>
          );
        },
      },
      {
        id: "reportsSended",
        header: "Reportes enviados",
        cell: ({ row }) => (
          <Badge variant="outline" className="gap-1 tabular-nums">
            <Mail className="size-3" aria-hidden />
            {row.original.reportsSendedCount}
          </Badge>
        ),
      },
      {
        accessorKey: "endDate",
        header: "Vencimiento",
        cell: ({ row }) => formatShortDate(new Date(row.original.endDate)),
      },
    ],
    [],
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPageIndex(0);
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por contrato, cliente, valla..."
        onRowClick={setSelected}
        emptyMessage="No hay contratos activos."
        manualPagination={{
          pageIndex,
          pageSize,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: handlePageSizeChange,
        }}
      />

      <ContractReportDrawer
        group={selected}
        reportType={reportType}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
