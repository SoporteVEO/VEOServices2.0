"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/api/users/users.types";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Status,
  StatusIndicator,
  StatusLabel,
} from "@/components/primitives/ui/status";
import { DataTable } from "@/components/ui/data-table";
import { formatShortDate } from "@/lib/format";
import { roleBadge, subRoleBadge } from "./const";

type UsersTableProps = {
  users: User[];
  isLoading?: boolean;
  onRowClick?: (user: User) => void;
};

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "firstName",
    header: "Nombre",
    cell: ({ row }) =>
      [row.original.firstName, row.original.lastName]
        .filter(Boolean)
        .join(" ") || "—",
  },
  {
    accessorKey: "email",
    header: "Correo",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Roles",
    cell: ({ row }) => {
      const badge = roleBadge[row.original.role] ?? roleBadge.USER;
      const subRoles = row.original.subRoles ?? [];
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={badge.variant} className={badge.className}>
            {badge.label}
          </Badge>
          {subRoles.map((sr) => {
            const sb = subRoleBadge[sr];
            if (!sb) return null;
            return (
              <Badge key={sr} variant={sb.variant} className={sb.className}>
                {sb.label}
              </Badge>
            );
          })}
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => {
      if (row.original.disabled) {
        return (
          <Status variant="error">
            <StatusIndicator />
            <StatusLabel>Deshabilitado</StatusLabel>
          </Status>
        );
      }
      return (
        <Status variant="success">
          <StatusIndicator />
          <StatusLabel>Activo</StatusLabel>
        </Status>
      );
    },
  },
  {
    accessorKey: "lastLoginAt",
    header: "Último acceso",
    cell: ({ row }) => {
      const value = row.original.lastLoginAt;
      if (!value) {
        return <span className="text-xs text-muted-foreground">Nunca</span>;
      }
      return (
        <span className="text-sm tabular-nums">
          {formatShortDate(new Date(value))}
        </span>
      );
    },
  },
];

export function UsersTable({
  users,
  isLoading = false,
  onRowClick,
}: UsersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={users}
      isLoading={isLoading}
      skeletonRowCount={5}
      onRowClick={onRowClick}
      emptyMessage="No hay usuarios registrados."
    />
  );
}
