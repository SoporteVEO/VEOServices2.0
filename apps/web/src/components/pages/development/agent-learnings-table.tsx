"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAgentLearnings } from "@/api/development/agent-learnings.get";
import type {
  AgentLearning,
  AgentLearningStatus,
} from "@/api/development/agent-learnings.types";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AgentLearningDialog } from "./agent-learning-dialog";
import { AGENT_LEARNINGS_COLUMNS } from "./agent-learnings-columns";
import { AGENT_ISSUES_DEFAULT_PAGE_SIZE } from "./const";
import {
  LEARNING_STATUS_ORDER,
  LEARNING_STATUS_TAB_LABELS,
} from "./learning-const";
import { TabCount } from "./tab-count";

const ALL = "ALL";

type DialogState = { open: false } | { open: true; learning: AgentLearning | null };

export function AgentLearningsTable() {
  const [status, setStatus] = useState<AgentLearningStatus | typeof ALL>(
    "PENDING",
  );
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(AGENT_ISSUES_DEFAULT_PAGE_SIZE);
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useAgentLearnings({
    status: status === ALL ? undefined : status,
    search: debouncedSearch || undefined,
    page: pageIndex + 1,
    pageSize,
  });

  const counts = data?.counts;
  const totalCount = counts
    ? LEARNING_STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0)
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as AgentLearningStatus | typeof ALL);
          setPageIndex(0);
        }}
      >
        <TabsList className="self-start">
          {LEARNING_STATUS_ORDER.map((value) => (
            <TabsTrigger key={value} value={value} className="px-4">
              {LEARNING_STATUS_TAB_LABELS[value]}
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
        columns={AGENT_LEARNINGS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar aprendizaje o pregunta..."
        emptyMessage="No hay aprendizajes con estos filtros."
        onRowClick={(learning) => setDialog({ open: true, learning })}
        sideButtons={
          <Button
            icon={Plus}
            onClick={() => setDialog({ open: true, learning: null })}
          >
            Nuevo aprendizaje
          </Button>
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

      <AgentLearningDialog
        open={dialog.open}
        learning={dialog.open ? dialog.learning : null}
        onOpenChange={(open) => {
          if (!open) setDialog({ open: false });
        }}
      />
    </div>
  );
}
