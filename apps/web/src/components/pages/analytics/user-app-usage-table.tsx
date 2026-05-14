"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserAppUsageUserRow } from "@/api/analytics/analytics.types";
import { DataTable } from "@/components/ui/data-table";
import { formatDuration } from "@/lib/format";

function displayName(row: UserAppUsageUserRow): string {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ");
  return name || "—";
}

function avgPerDayMs(row: UserAppUsageUserRow): number {
  if (row.activeDays <= 0) return 0;
  return Math.round(row.totalMs / row.activeDays);
}

export function UserAppUsageTable({
  users,
  isLoading,
}: {
  users: UserAppUsageUserRow[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<UserAppUsageUserRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Correo",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.email}</span>
        ),
      },
      {
        id: "name",
        header: "Nombre",
        cell: ({ row }) => displayName(row.original),
      },
      {
        accessorKey: "disabled",
        header: "Estado",
        cell: ({ row }) =>
          row.original.disabled ? (
            <span className="text-destructive">Deshabilitado</span>
          ) : (
            <span className="text-muted-foreground">Activo</span>
          ),
      },
      {
        accessorKey: "activeDays",
        header: "Días con uso",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.activeDays}</span>
        ),
      },
      {
        accessorKey: "totalMs",
        header: "Tiempo total",
        cell: ({ row }) => formatDuration(row.original.totalMs),
      },
      {
        id: "avgDay",
        header: "Promedio / día",
        cell: ({ row }) => formatDuration(avgPerDayMs(row.original)),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={users}
      isLoading={isLoading}
      pagination={{ pageSize: 15 }}
      emptyMessage="No hay registros de uso en este rango."
    />
  );
}
