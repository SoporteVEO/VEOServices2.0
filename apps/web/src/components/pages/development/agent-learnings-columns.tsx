"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AgentLearning } from "@/api/development/agent-learnings.types";
import { AgentLearningActions } from "./agent-learning-actions";
import { LearningStatusBadge } from "./agent-learning-badges";
import { formatIssueDateTime, issueUserName } from "./const";
import { LEARNING_SOURCE_LABELS } from "./learning-const";

export const AGENT_LEARNINGS_COLUMNS: ColumnDef<AgentLearning>[] = [
  {
    accessorKey: "content",
    header: "Aprendizaje",
    cell: ({ row }) => (
      <div className="flex min-w-0 max-w-[560px] flex-col">
        <span className="line-clamp-2 whitespace-normal font-medium">
          {row.original.content}
        </span>
        {row.original.example ? (
          <span className="truncate text-xs text-muted-foreground">
            Pregunta: {row.original.example}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "source",
    header: "Origen",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm">
        {LEARNING_SOURCE_LABELS[row.original.source]}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => <LearningStatusBadge status={row.original.status} />,
  },
  {
    id: "proposedBy",
    header: "Enseñado por",
    cell: ({ row }) => (
      <span className="truncate text-sm">
        {issueUserName(row.original.proposedBy)}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Actualizado",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
        {formatIssueDateTime(row.original.updatedAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <AgentLearningActions
        id={row.original.id}
        status={row.original.status}
      />
    ),
  },
];
