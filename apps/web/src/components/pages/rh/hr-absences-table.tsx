"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Absence } from "@/api/absences/absences.types";
import {
  AbsenceStatusBadge,
  computeAbsenceDays,
} from "@/components/pages/absences";
import { DataTable } from "@/components/ui/data-table";
import { formatHumanDate } from "@/lib/format";
import { HrAbsenceDetailDrawer } from "./hr-absence-detail-drawer";

export function HrAbsencesTable({
  absences,
  isLoading = false,
}: {
  absences: Absence[];
  isLoading?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = absences.find((a) => a.id === selectedId) ?? null;

  const columns: ColumnDef<Absence>[] = [
    {
      id: "user",
      header: "Empleado",
      cell: ({ row }) => {
        const fullName = [
          row.original.user.firstName,
          row.original.user.lastName,
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium">{fullName || "—"}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.user.email}
            </span>
          </div>
        );
      },
    },
    {
      id: "range",
      header: "Periodo",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">
            {formatHumanDate(row.original.fromDate)} —{" "}
            {formatHumanDate(row.original.toDate)}
          </span>
          <span className="text-xs text-muted-foreground">
            {computeAbsenceDays(row.original.fromDate, row.original.toDate)}{" "}
            día(s)
          </span>
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Motivo",
      cell: ({ row }) => (
        <p className="line-clamp-2 max-w-[420px] text-sm text-muted-foreground">
          {row.original.reason}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <AbsenceStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Creada",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatHumanDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={absences}
        isLoading={isLoading}
        skeletonRowCount={6}
        emptyMessage="No hay solicitudes de incapacidad registradas."
        onRowClick={(row) => setSelectedId(row.id)}
      />

      <HrAbsenceDetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        absence={selected}
      />
    </>
  );
}
