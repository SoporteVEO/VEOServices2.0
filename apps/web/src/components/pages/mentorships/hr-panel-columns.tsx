"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Archive } from "lucide-react";
import type {
  MentorshipDashboard,
  MentorshipDashboardRow,
  MentorshipHistoryRow,
} from "@/api/mentorships/mentorships.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatDay, percentLabel } from "./const";
import {
  AcknowledgementBadge,
  MentorshipStatusBadge,
  StartOutcomeBadge,
} from "./mentorship-badges";

type DepartmentRow = MentorshipDashboard["departments"][number];

function Count({ value, className }: { value: number; className?: string }) {
  return <span className={`tabular-nums ${className ?? ""}`}>{value}</span>;
}

export const DEPARTMENT_COLUMNS: ColumnDef<DepartmentRow>[] = [
  {
    accessorKey: "name",
    header: "Área/Gerencia",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "collaborators",
    header: "Colaboradores",
    cell: ({ row }) => <Count value={row.original.collaborators} />,
  },
  {
    accessorKey: "done",
    header: "Realizadas",
    cell: ({ row }) => (
      <Count
        value={row.original.done}
        className="text-emerald-700 dark:text-emerald-400"
      />
    ),
  },
  {
    accessorKey: "pending",
    header: "Pendientes",
    cell: ({ row }) => (
      <Count
        value={row.original.pending}
        className="text-amber-700 dark:text-amber-400"
      />
    ),
  },
  {
    accessorKey: "overdue",
    header: "Vencidas",
    cell: ({ row }) => (
      <Count
        value={row.original.overdue}
        className="text-red-700 dark:text-red-400"
      />
    ),
  },
  {
    accessorKey: "completion",
    header: "Avance",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {percentLabel(row.original.completion)}
      </span>
    ),
  },
  {
    accessorKey: "startCompliance",
    header: "Starts cumplidos",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="tabular-nums">
          {percentLabel(row.original.startCompliance)}
        </span>
        {row.original.startEvaluated > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.original.startYes} de {row.original.startEvaluated} evaluados
          </span>
        ) : null}
      </div>
    ),
  },
];

export const QUARTER_COLLABORATOR_COLUMNS: ColumnDef<MentorshipDashboardRow>[] =
  [
    {
      accessorKey: "name",
      header: "Colaborador",
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {row.original.position ?? "Sin cargo"} ·{" "}
            {row.original.departmentName}
          </span>
        </div>
      ),
    },
    {
      id: "boss",
      header: "Jefe directo",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.boss?.name ?? "—"}</span>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => <MentorshipStatusBadge status={row.original.status} />,
    },
    {
      id: "session",
      header: "Sesión",
      cell: ({ row }) => {
        const session = row.original.session;
        if (!session) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm whitespace-nowrap tabular-nums">
              N.º {session.sessionNumber} · {formatDay(session.sessionDate)}
            </span>
            <AcknowledgementBadge acknowledgedAt={session.acknowledgedAt} />
          </div>
        );
      },
    },
    {
      id: "startOutcome",
      header: "Start anterior",
      cell: ({ row }) =>
        row.original.startOutcome ? (
          <StartOutcomeBadge outcome={row.original.startOutcome} prefix="" />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

export const HISTORY_COLUMNS: ColumnDef<MentorshipHistoryRow>[] = [
  {
    accessorKey: "name",
    header: "Colaborador",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {[row.original.position, row.original.department?.name]
              .filter(Boolean)
              .join(" · ") || "Sin cargo asignado"}
          </span>
        </div>
        {row.original.archived ? (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            <Archive className="mr-1 size-3" />
            Archivado
          </Badge>
        ) : null}
      </div>
    ),
  },
  {
    id: "boss",
    header: "Jefe directo",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.boss?.name ?? "—"}</span>
    ),
  },
  {
    accessorKey: "totalSessions",
    header: "Sesiones",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.totalSessions}</span>
    ),
  },
  {
    accessorKey: "lastSessionDate",
    header: "Última sesión",
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap tabular-nums">
        {formatDay(row.original.lastSessionDate)}
      </span>
    ),
  },
];
