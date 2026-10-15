"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Mail, MessageCircle, Phone, Star } from "lucide-react";
import type { CrmContact } from "@/api/crm/crm.types";
import { Avatar, AvatarFallback } from "@/components/primitives/ui/avatar";
import { clientLabel, personInitials, personName } from "../crm-format";

function Muted() {
  return <span className="text-xs text-muted-foreground">—</span>;
}

export const CRM_CONTACTS_COLUMNS: ColumnDef<CrmContact>[] = [
  {
    accessorKey: "firstName",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback className="text-[10px]">
            {personInitials(row.original)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate font-medium">
            {personName(row.original)}
            {row.original.isPrimary ? (
              <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Principal" />
            ) : null}
          </p>
          {row.original.jobTitle ? (
            <p className="truncate text-xs text-muted-foreground">{row.original.jobTitle}</p>
          ) : null}
        </div>
      </div>
    ),
  },
  {
    id: "client",
    header: "Cliente",
    cell: ({ row }) => {
      const label = clientLabel(row.original.client);
      if (!label) return <Muted />;
      return (
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <Building2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Correo",
    cell: ({ row }) =>
      row.original.email ? (
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{row.original.email}</span>
        </div>
      ) : (
        <Muted />
      ),
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => {
      const { phone, whatsapp } = row.original;
      if (!phone && !whatsapp) return <Muted />;
      return (
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          {phone ? (
            <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <MessageCircle className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <span className="truncate">{phone ?? `+${whatsapp}`}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "openDeals",
    header: "Negocios abiertos",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.openDeals}</span>
    ),
  },
];
