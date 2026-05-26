"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Check, Clock, Monitor } from "lucide-react";
import { Badge } from "@/components/primitives/ui/badge";
import { formatBriloShortDate } from "@/lib/format";
import type { ActiveContractGroup } from "@/api/contracts/contracts.get";

export const MY_ACTIVE_CONTRACTS_COLUMNS: ColumnDef<ActiveContractGroup>[] = [
  {
    accessorKey: "contractNumber",
    header: "Contrato",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.contractNumber}</span>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate">{row.original.customerName ?? "—"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.customerEmail ?? "Sin correo"}
        </p>
      </div>
    ),
  },
  {
    id: "billboards",
    header: "Vallas",
    cell: ({ row }) => (
      <Badge variant="secondary" className="gap-1">
        <Monitor className="size-3" aria-hidden />
        {row.original.totalBillboards}
      </Badge>
    ),
  },
  {
    id: "monthlyReport",
    header: "Reporte mensual",
    cell: ({ row }) => {
      const sent = row.original.reportsSendedCount > 0;
      return (
        <Badge
          variant={sent ? "default" : "secondary"}
          className="gap-1 whitespace-nowrap"
        >
          {sent ? (
            <Check className="size-3" aria-hidden />
          ) : (
            <Clock className="size-3" aria-hidden />
          )}
          {sent ? "Enviado" : "Pendiente"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "endDate",
    header: "Vencimiento",
    cell: ({ row }) => formatBriloShortDate(row.original.endDate),
  },
];
