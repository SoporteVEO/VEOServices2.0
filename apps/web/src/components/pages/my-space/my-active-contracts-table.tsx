"use client";

import { useId, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Switch } from "@/components/primitives/ui/switch";
import { Label } from "@/components/primitives/ui/label";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useMyActiveContracts,
  type ActiveContractGroup,
} from "@/api/contracts/contracts.get";
import { ContractReportDrawer } from "@/components/pages/reports";
import { REPORT_TYPE_CONFIG } from "@/components/pages/reports/report-types";
import { MY_ACTIVE_CONTRACTS_COLUMNS } from "./my-active-contracts-columns";
import {
  MY_ACTIVE_CONTRACTS_DEFAULT_PAGE_SIZE,
  MY_ACTIVE_CONTRACTS_EMPTY_MESSAGE,
  MY_ACTIVE_CONTRACTS_SEARCH_PLACEHOLDER,
} from "./const";
import { useMySpaceViewAs } from "./my-space-view-as-context";

const MONTHLY_REPORT = REPORT_TYPE_CONFIG.monthly;

export function MyActiveContractsTable() {
  const { viewAsUserId } = useMySpaceViewAs();
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(
    MY_ACTIVE_CONTRACTS_DEFAULT_PAGE_SIZE,
  );
  const [selected, setSelected] = useState<ActiveContractGroup | null>(null);
  const [excludeCreatedThisMonth, setExcludeCreatedThisMonth] = useState(true);
  const excludeNewContractsId = useId();

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading } = useMyActiveContracts({
    page: pageIndex + 1,
    pageSize,
    search: debouncedSearch || undefined,
    imageType: MONTHLY_REPORT.imageType,
    excludeCreatedThisMonth,
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

  function handleExcludeCreatedThisMonthChange(checked: boolean) {
    setExcludeCreatedThisMonth(checked);
    setPageIndex(0);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        className="min-h-0 flex-1"
        columns={MY_ACTIVE_CONTRACTS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={MY_ACTIVE_CONTRACTS_SEARCH_PLACEHOLDER}
        emptyMessage={MY_ACTIVE_CONTRACTS_EMPTY_MESSAGE}
        onRowClick={setSelected}
        sideButtons={
          <div className="flex items-center gap-2">
            <Switch
              id={excludeNewContractsId}
              checked={excludeCreatedThisMonth}
              onCheckedChange={handleExcludeCreatedThisMonthChange}
              className="bg-input"
            />
            <Label
              htmlFor={excludeNewContractsId}
              className="text-sm font-normal whitespace-nowrap"
            >
              Ocultar contratos que inician este mes
            </Label>
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

      <ContractReportDrawer
        group={selected}
        reportType="monthly"
        readOnly={Boolean(viewAsUserId)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
