"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { TeamMember } from "@/api/team-members/team-members.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/format";
import { TeamMemberFormDialog } from "./team-member-form-dialog";
import { DeleteTeamMemberDialog } from "./delete-team-member-dialog";

function ActionsCell({
  teamMember,
  onEdit,
  onDelete,
}: {
  teamMember: TeamMember;
  onEdit: (m: TeamMember) => void;
  onDelete: (m: TeamMember) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" sizeVariant="sm" className="size-8 p-0">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(teamMember)}>
          <Pencil className="mr-2 size-3.5" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(teamMember)}
        >
          <Trash2 className="mr-2 size-3.5" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TeamMembersTable({
  teamMembers,
  isLoading = false,
}: {
  teamMembers: TeamMember[];
  isLoading?: boolean;
}) {
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);

  const existingUserIds = useMemo(
    () => teamMembers.map((m) => m.userId),
    [teamMembers],
  );

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
      id: "vacations",
      header: "Vacaciones",
      cell: ({ row }) => {
        const { vacations, usedVacations } = row.original;
        const remaining = vacations - usedVacations;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium">
              {remaining} {remaining === 1 ? "día" : "días"} disponibles
            </span>
            <span className="text-xs text-muted-foreground">
              {usedVacations} usados de {vacations}
            </span>
          </div>
        );
      },
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
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionsCell
          teamMember={row.original}
          onEdit={setEditMember}
          onDelete={setDeleteMember}
        />
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
      />

      <TeamMemberFormDialog
        open={!!editMember}
        onOpenChange={(open) => {
          if (!open) setEditMember(null);
        }}
        teamMember={editMember}
        existingUserIds={existingUserIds}
      />

      <DeleteTeamMemberDialog
        open={!!deleteMember}
        onOpenChange={(open) => {
          if (!open) setDeleteMember(null);
        }}
        teamMember={deleteMember}
      />
    </>
  );
}
