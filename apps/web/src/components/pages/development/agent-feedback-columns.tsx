"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AgentFeedbackListItem } from "@/api/development/agent-learnings.types";
import { FEEDBACK_REASON_LABELS } from "@/components/dashboard/agent/agent-feedback-const";
import {
  FeedbackRatingIcon,
  FeedbackReviewBadge,
} from "./agent-learning-badges";
import { formatIssueDateTime, issueUserName } from "./const";

export const AGENT_FEEDBACK_COLUMNS: ColumnDef<AgentFeedbackListItem>[] = [
  {
    accessorKey: "rating",
    header: "",
    cell: ({ row }) => <FeedbackRatingIcon rating={row.original.rating} />,
  },
  {
    accessorKey: "question",
    header: "Pregunta",
    cell: ({ row }) => (
      <div className="flex min-w-0 max-w-[520px] flex-col">
        <span className="truncate font-medium">
          {row.original.question || "—"}
        </span>
        {row.original.comment ? (
          <span className="truncate text-xs text-muted-foreground">
            “{row.original.comment}”
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "reason",
    header: "Motivo",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm">
        {row.original.reason ? FEEDBACK_REASON_LABELS[row.original.reason] : "—"}
      </span>
    ),
  },
  {
    accessorKey: "review",
    header: "Revisión",
    cell: ({ row }) => <FeedbackReviewBadge review={row.original.review} />,
  },
  {
    accessorKey: "learningCount",
    header: "Aprendizajes",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {row.original.learningCount || "—"}
      </span>
    ),
  },
  {
    id: "user",
    header: "Usuario",
    cell: ({ row }) => (
      <span className="truncate text-sm">
        {issueUserName(row.original.user)}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Fecha",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
        {formatIssueDateTime(row.original.createdAt)}
      </span>
    ),
  },
];
