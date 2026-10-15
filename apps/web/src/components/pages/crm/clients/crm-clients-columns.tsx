"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CrmClientRow } from "@/api/crm/crm.types";
import { getClientInitials } from "@/components/pages/clients/client-initials";
import { ClientTypeBadge } from "@/components/pages/clients/client-type-badge";
import { Avatar, AvatarFallback } from "@/components/primitives/ui/avatar";
import { formatMoney } from "@/lib/format";
import { timeAgo } from "../crm-format";

function Numeric({ value }: { value: number }) {
  return (
    <span className={value === 0 ? "text-muted-foreground tabular-nums" : "tabular-nums"}>
      {value}
    </span>
  );
}

export const CRM_CLIENTS_COLUMNS: ColumnDef<CrmClientRow>[] = [
  {
    accessorKey: "name",
    header: "Cliente",
    cell: ({ row }) => {
      const { name, company, email } = row.original;
      const title = company?.trim() || name;
      return (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{getClientInitials({ name: title, email })}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{title}</p>
            {title !== name ? (
              <p className="truncate text-xs text-muted-foreground">{name}</p>
            ) : null}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => <ClientTypeBadge type={row.original.type} />,
  },
  {
    accessorKey: "contactsCount",
    header: "Contactos",
    cell: ({ row }) => <Numeric value={row.original.contactsCount} />,
  },
  {
    accessorKey: "openDeals",
    header: "Abiertos",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Numeric value={row.original.openDeals} />
        {row.original.openValue > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatMoney(row.original.openValue)}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "wonValue",
    header: "Ganado",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.wonValue > 0 ? formatMoney(row.original.wonValue) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "offersCount",
    header: "Cotizaciones",
    cell: ({ row }) => <Numeric value={row.original.offersCount} />,
  },
  {
    accessorKey: "lastActivityAt",
    header: "Última actividad",
    cell: ({ row }) =>
      row.original.lastActivityAt ? (
        <span className="text-xs text-muted-foreground">
          {timeAgo(row.original.lastActivityAt)}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
];
