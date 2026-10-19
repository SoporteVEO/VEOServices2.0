"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PenLine } from "lucide-react";
import type { FeatureRequestListItem } from "@/api/feature-requests/feature-requests.types";
import {
  FeatureRequestPriorityBadge,
  FeatureRequestStatusBadge,
} from "./feature-request-badges";
import { formatDateTime, userName } from "./const";

const TICKET_COLUMN: ColumnDef<FeatureRequestListItem> = {
  accessorKey: "ticket",
  header: "Ticket",
  cell: ({ row }) => (
    <span className="font-mono text-xs font-semibold">
      {row.original.ticket}
    </span>
  ),
};

const TITLE_COLUMN: ColumnDef<FeatureRequestListItem> = {
  accessorKey: "title",
  header: "Solicitud",
  cell: ({ row }) => (
    <div className="flex min-w-0 max-w-[480px] flex-col">
      <span className="truncate font-medium">{row.original.title}</span>
      <span className="truncate text-xs text-muted-foreground">
        {row.original.summary}
      </span>
    </div>
  ),
};

const PRIORITY_COLUMN: ColumnDef<FeatureRequestListItem> = {
  accessorKey: "priority",
  header: "Prioridad",
  cell: ({ row }) => (
    <FeatureRequestPriorityBadge priority={row.original.priority} />
  ),
};

const STATUS_COLUMN: ColumnDef<FeatureRequestListItem> = {
  accessorKey: "status",
  header: "Estado",
  cell: ({ row }) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <FeatureRequestStatusBadge status={row.original.status} />
      {row.original.awaitingMySignature ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400">
          <PenLine className="size-3" />
          Requiere tu firma
        </span>
      ) : null}
    </div>
  ),
};

const SIGNATURES_COLUMN: ColumnDef<FeatureRequestListItem> = {
  id: "signatures",
  header: "Firmas",
  cell: ({ row }) => {
    const { status, signatures } = row.original;
    if (status !== "COMPLETED" && status !== "APPROVED") {
      return <span className="text-muted-foreground">—</span>;
    }
    return (
      <span className="tabular-nums text-sm">
        {signatures.signed}/{signatures.required}
      </span>
    );
  },
};

const REQUESTER_COLUMN: ColumnDef<FeatureRequestListItem> = {
  id: "requester",
  header: "Solicitante",
  cell: ({ row }) => (
    <div className="flex flex-col">
      <span className="truncate text-sm">{userName(row.original.requester)}</span>
      {row.original.collaboratorCount > 0 ? (
        <span className="text-xs text-muted-foreground">
          +{row.original.collaboratorCount} colaborador
          {row.original.collaboratorCount === 1 ? "" : "es"}
        </span>
      ) : null}
    </div>
  ),
};

const CREATED_COLUMN: ColumnDef<FeatureRequestListItem> = {
  accessorKey: "createdAt",
  header: "Enviada",
  cell: ({ row }) => (
    <span className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
      {formatDateTime(row.original.createdAt)}
    </span>
  ),
};

export const MY_FEATURE_REQUESTS_COLUMNS: ColumnDef<FeatureRequestListItem>[] = [
  TICKET_COLUMN,
  TITLE_COLUMN,
  PRIORITY_COLUMN,
  STATUS_COLUMN,
  SIGNATURES_COLUMN,
  CREATED_COLUMN,
];

export const DEV_FEATURE_REQUESTS_COLUMNS: ColumnDef<FeatureRequestListItem>[] = [
  TICKET_COLUMN,
  TITLE_COLUMN,
  PRIORITY_COLUMN,
  STATUS_COLUMN,
  REQUESTER_COLUMN,
  SIGNATURES_COLUMN,
  CREATED_COLUMN,
];
