"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TeamMember } from "@/api/team-members/team-members.types";
import { DataTable } from "@/components/ui/data-table";
import { formatMoney } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/team-member-labels";
import { TeamMemberDetailDrawer } from "./team-member-detail-drawer";

export function TeamMembersTable({
  teamMembers,
  isLoading = false,
}: {
  teamMembers: TeamMember[];
  isLoading?: boolean;
}) {
  const [drawerMemberId, setDrawerMemberId] = useState<string | null>(null);

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "firstName",
      header: "Nombre",
      cell: ({ row }) =>
        [row.original.firstName, row.original.lastName]
          .filter(Boolean)
          .join(" "),
    },
    {
      accessorKey: "position",
      header: "Cargo",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.position}</span>
      ),
    },
    {
      accessorKey: "businessEmail",
      header: "Correo corporativo",
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.businessEmail}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {row.original.businessEmail}
        </a>
      ),
    },
    {
      accessorKey: "salary",
      header: "Salario",
      cell: ({ row }) => formatMoney(row.original.salary),
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => (
        <span className="text-sm">{STATUS_LABELS[row.original.status]}</span>
      ),
    },
    {
      id: "linkedUser",
      header: "Usuario vinculado",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.user.email}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={teamMembers}
        isLoading={isLoading}
        skeletonRowCount={5}
        emptyMessage="No hay miembros registrados en la plantilla."
        onRowClick={(row) => setDrawerMemberId(row.id)}
      />

      <TeamMemberDetailDrawer
        teamMemberId={drawerMemberId}
        open={drawerMemberId !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerMemberId(null);
        }}
      />
    </>
  );
}
