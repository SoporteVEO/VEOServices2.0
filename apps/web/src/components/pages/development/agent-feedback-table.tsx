"use client";

import { useState } from "react";
import type { AgentFeedbackRating } from "@/api/agent/agent.types";
import { useAgentFeedbackList } from "@/api/development/agent-learnings.get";
import type { AgentFeedbackReview } from "@/api/development/agent-learnings.types";
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
import { AGENT_FEEDBACK_COLUMNS } from "./agent-feedback-columns";
import { AgentFeedbackDialog } from "./agent-feedback-dialog";
import { AGENT_ISSUES_DEFAULT_PAGE_SIZE } from "./const";
import {
  FEEDBACK_REVIEW_ORDER,
  FEEDBACK_REVIEW_TAB_LABELS,
} from "./learning-const";
import { TabCount } from "./tab-count";

const ALL = "ALL";

export function AgentFeedbackTable() {
  const [review, setReview] = useState<AgentFeedbackReview | typeof ALL>(
    "PENDING",
  );
  const [rating, setRating] = useState<AgentFeedbackRating | typeof ALL>(ALL);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(AGENT_ISSUES_DEFAULT_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useAgentFeedbackList({
    review: review === ALL ? undefined : review,
    rating: rating === ALL ? undefined : rating,
    search: debouncedSearch || undefined,
    page: pageIndex + 1,
    pageSize,
  });

  const counts = data?.counts;
  const totalCount = counts
    ? FEEDBACK_REVIEW_ORDER.reduce((sum, r) => sum + counts[r], 0)
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Tabs
        value={review}
        onValueChange={(value) => {
          setReview(value as AgentFeedbackReview | typeof ALL);
          setPageIndex(0);
        }}
      >
        <TabsList className="self-start">
          {FEEDBACK_REVIEW_ORDER.map((value) => (
            <TabsTrigger key={value} value={value} className="px-4">
              {FEEDBACK_REVIEW_TAB_LABELS[value]}
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
        columns={AGENT_FEEDBACK_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar por pregunta o comentario..."
        emptyMessage="No hay calificaciones con estos filtros."
        onRowClick={(row) => setSelectedId(row.id)}
        sideButtons={
          <Select
            value={rating}
            onValueChange={(value) => {
              setRating(value as AgentFeedbackRating | typeof ALL);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Calificación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              <SelectItem value="DISLIKE">No me gusta</SelectItem>
              <SelectItem value="LIKE">Me gusta</SelectItem>
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

      <AgentFeedbackDialog
        feedbackId={selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
