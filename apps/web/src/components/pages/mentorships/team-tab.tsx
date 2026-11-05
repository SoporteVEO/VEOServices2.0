"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, CircleCheck, Clock, TriangleAlert } from "lucide-react";
import { useMentorshipTeam } from "@/api/mentorships/mentorships.get";
import type { MentorshipTeamMember } from "@/api/mentorships/mentorships.types";
import { DataTable } from "@/components/ui/data-table";
import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";
import { formatDay } from "./const";
import {
  AcknowledgementBadge,
  MentorshipStatusBadge,
} from "./mentorship-badges";

const COLUMNS: ColumnDef<MentorshipTeamMember>[] = [
  {
    accessorKey: "name",
    header: "Colaborador",
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{row.original.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {[row.original.position, row.original.department?.name]
            .filter(Boolean)
            .join(" · ") || "Sin cargo asignado"}
        </span>
      </div>
    ),
  },
  {
    id: "status",
    header: "Estado del trimestre",
    cell: ({ row }) => (
      <MentorshipStatusBadge status={row.original.quarterStatus} />
    ),
  },
  {
    id: "session",
    header: "Sesión",
    cell: ({ row }) => {
      const session = row.original.quarterSession;
      if (!session) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm tabular-nums">
            N.º {session.sessionNumber} · {formatDay(session.sessionDate)}
          </span>
          <AcknowledgementBadge acknowledgedAt={session.acknowledgedAt} />
        </div>
      );
    },
  },
  {
    id: "lastStart",
    header: "Último Start",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[320px] text-sm text-muted-foreground">
        {row.original.lastSession?.startWhat ?? "Primera mentoría"}
      </span>
    ),
  },
  {
    id: "followUp",
    header: "Próximo seguimiento",
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap tabular-nums">
        {formatDay(row.original.lastSession?.nextFollowUpDate)}
      </span>
    ),
  },
];

export function TeamTab({
  onOpenCollaborator,
}: {
  onOpenCollaborator: (userId: string) => void;
}) {
  const { data, isLoading, isError } = useMentorshipTeam(true);
  const [search, setSearch] = useState("");

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        No pudimos cargar tu equipo.
      </p>
    );
  }

  const members = data?.members ?? [];
  const term = search.trim().toLowerCase();
  const visible = term
    ? members.filter((m) => m.name.toLowerCase().includes(term))
    : members;
  const count = (status: MentorshipTeamMember["quarterStatus"]) =>
    members.filter((m) => m.quarterStatus === status).length;

  const items: KpiItem[] = data
    ? [
        {
          icon: CalendarClock,
          label: data.quarter.label,
          value: members.length,
          detail: `Fecha límite: ${formatDay(data.quarter.deadline)}`,
        },
        {
          icon: CircleCheck,
          label: "Realizadas",
          value: count("DONE"),
          tone: "emerald",
        },
        {
          icon: Clock,
          label: "Pendientes",
          value: count("PENDING"),
          tone: "amber",
        },
        {
          icon: TriangleAlert,
          label: "Vencidas",
          value: count("OVERDUE"),
          tone: "rose",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      {data ? (
        <KpiGrid className="sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <KpiTile key={item.label} item={item} />
          ))}
        </KpiGrid>
      ) : (
        <KpiGridSkeleton count={4} className="sm:grid-cols-2 lg:grid-cols-4" />
      )}
      <DataTable
        columns={COLUMNS}
        data={visible}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar colaborador..."
        emptyMessage={
          term
            ? "Nadie de tu equipo coincide con esa búsqueda."
            : "No tienes colaboradores directos activos."
        }
        onRowClick={(member) => onOpenCollaborator(member.userId)}
      />
    </div>
  );
}
