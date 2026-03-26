"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/primitives/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import type { NotifiedContract } from "@/api/contracts/contracts.get";

const statusBadge: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  SENT: { label: "Enviado", variant: "default" },
  FAILED: { label: "Fallido", variant: "destructive" },
  PENDING: { label: "Pendiente", variant: "secondary" },
};

export function NotifiedContractsTable({
  contracts,
  isLoading = false,
}: {
  contracts: NotifiedContract[];
  isLoading?: boolean;
}) {
  const columns = useMemo<ColumnDef<NotifiedContract>[]>(
    () => [
      {
        accessorKey: "contractNumber",
        header: "Contrato",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.contractNumber}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const badge = statusBadge[row.original.status] ?? statusBadge.PENDING;
          return <Badge variant={badge.variant}>{badge.label}</Badge>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Fecha notificacion",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "errorMessage",
        header: "Error",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.errorMessage ?? "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="rounded-lg border">
      <DataTable columns={columns} data={contracts} isLoading={isLoading} />
    </div>
  );
}
