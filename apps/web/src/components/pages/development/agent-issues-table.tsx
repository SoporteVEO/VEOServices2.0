"use client";

import { useState } from "react";
import { useAgentIssues } from "@/api/development/agent-issues.get";
import type {
  AgentIssueListItem,
  AgentIssueSeverity,
  AgentIssueStatus,
} from "@/api/development/agent-issues.types";
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
import { AgentIssueDrawer } from "./agent-issue-drawer";
import { AGENT_ISSUES_COLUMNS } from "./agent-issues-columns";
import {
  AGENT_ISSUES_DEFAULT_PAGE_SIZE,
  AGENT_ISSUES_SEARCH_PLACEHOLDER,
  ISSUE_SEVERITY_LABELS,
  ISSUE_SEVERITY_ORDER,
  ISSUE_STATUS_ORDER,
  ISSUE_STATUS_TAB_LABELS,
} from "./const";
import { TabCount } from "./tab-count";

const ALL = "ALL";

export function AgentIssuesTable() {
  const [status, setStatus] = useState<AgentIssueStatus | typeof ALL>("OPEN");
  const [severity, setSeverity] = useState<AgentIssueSeverity | typeof ALL>(
    ALL,
  );
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(AGENT_ISSUES_DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<AgentIssueListItem | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useAgentIssues({
    status: status === ALL ? undefined : status,
    severity: severity === ALL ? undefined : severity,
    search: debouncedSearch || undefined,
    page: pageIndex + 1,
    pageSize,
  });

  const counts = data?.counts;
  const totalCount = counts
    ? ISSUE_STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0)
    : undefined;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as AgentIssueStatus | typeof ALL);
          setPageIndex(0);
        }}
      >
        <TabsList className="self-start">
          {ISSUE_STATUS_ORDER.map((value) => (
            <TabsTrigger key={value} value={value} className="px-4">
              {ISSUE_STATUS_TAB_LABELS[value]}
              <TabCount value={counts?.[value]} />
            </TabsTrigger>
          ))}
          <TabsTrigger value={ALL} className="px-4">
            Todos
            <TabCount value={totalCount} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        className="min-h-0 flex-1"
        columns={AGENT_ISSUES_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={AGENT_ISSUES_SEARCH_PLACEHOLDER}
        emptyMessage="No hay tickets con estos filtros."
        onRowClick={setSelected}
        sideButtons={
          <Select
            value={severity}
            onValueChange={(value) => {
              setSeverity(value as AgentIssueSeverity | typeof ALL);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Severidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las severidades</SelectItem>
              {ISSUE_SEVERITY_ORDER.map((value) => (
                <SelectItem key={value} value={value}>
                  {ISSUE_SEVERITY_LABELS[value]}
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

      <AgentIssueDrawer
        issueId={selected?.id ?? null}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}