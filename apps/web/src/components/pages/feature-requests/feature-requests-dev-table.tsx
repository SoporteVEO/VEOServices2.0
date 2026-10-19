"use client";

import { useState } from "react";
import { useDevFeatureRequests } from "@/api/feature-requests/feature-requests.get";
import type {
  FeatureRequestPriority,
  FeatureRequestStatus,
} from "@/api/feature-requests/feature-requests.types";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { TabCount } from "../development/tab-count";
import { FeatureRequestDrawer } from "./feature-request-drawer";
import { DEV_FEATURE_REQUESTS_COLUMNS } from "./feature-requests-columns";
import {
  DEFAULT_PAGE_SIZE,
  DEV_SEARCH_PLACEHOLDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_ORDER,
  STATUS_TAB_LABELS,
} from "./const";
import { useSelectedRequest } from "./use-selected-request";

const ALL = "ALL";

export function FeatureRequestsDevTable() {
  const { selectedId, select } = useSelectedRequest();
  const [status, setStatus] = useState<FeatureRequestStatus | typeof ALL>(
    "SUBMITTED",
  );
  const [priority, setPriority] = useState<FeatureRequestPriority | typeof ALL>(
    ALL,
  );
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useDevFeatureRequests({
    status: status === ALL ? undefined : status,
    priority: priority === ALL ? undefined : priority,
    search: debouncedSearch || undefined,
    page: pageIndex + 1,
    pageSize,
  });

  const counts = data?.counts;
  const totalCount = counts
    ? STATUS_ORDER.reduce((sum, value) => sum + counts[value], 0)
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as FeatureRequestStatus | typeof ALL);
          setPageIndex(0);
        }}
      >
        <TabsList className="self-start">
          {STATUS_ORDER.map((value) => (
            <TabsTrigger key={value} value={value} className="px-4">
              {STATUS_TAB_LABELS[value]}
              <TabCount value={counts?.[value]} />
            </TabsTrigger>
          ))}
          <TabsTrigger value={ALL} className="px-4">
            Todas
            <TabCount value={totalCount} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        className="min-h-0 flex-1"
        columns={DEV_FEATURE_REQUESTS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder={DEV_SEARCH_PLACEHOLDER}
        emptyMessage="No hay solicitudes con estos filtros."
        onRowClick={(request) => select(request.id)}
        sideButtons={
          <Select
            value={priority}
            onValueChange={(value) => {
              setPriority(value as FeatureRequestPriority | typeof ALL);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las prioridades</SelectItem>
              {PRIORITY_ORDER.map((value) => (
                <SelectItem key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <FeatureRequestDrawer requestId={selectedId} onClose={() => select(null)} />
    </div>
  );
}
