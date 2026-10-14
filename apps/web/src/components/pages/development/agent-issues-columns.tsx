"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AgentIssueListItem } from "@/api/development/agent-issues.types";
import { IssueSeverityBadge, IssueStatusBadge } from "./agent-issue-badges";
import { formatIssueDateTime, issueUserName } from "./const";

export const AGENT_ISSUES_COLUMNS: ColumnDef<AgentIssueListItem>[] = [
  {
    accessorKey: "ticket",
    header: "Ticket",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold">
        {row.original.ticket}
      </span>
    ),
  },
  {
    accessorKey: "title",
    header: "Problema",
    cell: ({ row }) => (
      <div className="flex min-w-0 max-w-[520px] flex-col">
        <span className="truncate font-medium">{row.original.title}</span>
        <span className="truncate text-xs text-muted-foreground">
          {row.original.summary}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "severity",
    header: "Severidad",
    cell: ({ row }) => <IssueSeverityBadge severity={row.original.severity} />,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => <IssueStatusBadge status={row.original.status} />,
  },
  {
    id: "reporter",
    header: "Usuario",
    cell: ({ row }) => (
      <span className="truncate text-sm">
        {issueUserName(row.original.reporter)}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Reportado",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
        {formatIssueDateTime(row.original.createdAt)}
      </span>
    ),
  },
];
