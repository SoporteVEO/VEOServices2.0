"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Mail, Phone } from "lucide-react";

import type { Client } from "@/api/clients/clients.types";
import { Avatar, AvatarFallback } from "@/components/primitives/ui/avatar";
import { getClientInitials } from "./client-initials";
import { ClientTypeBadge } from "./client-type-badge";

export const CLIENTS_COLUMNS: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>
            {getClientInitials(row.original)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => <ClientTypeBadge type={row.original.type} />,
  },
  {
    accessorKey: "company",
    header: "Empresa",
    cell: ({ row }) => {
      const company = row.original.company;
      if (!company) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <Building2
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="truncate">{company}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Correo",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <Mail
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span className="truncate">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "contact",
    header: "Teléfono",
    cell: ({ row }) => {
      const contact = row.original.contact;
      if (!contact) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <Phone
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="truncate">{contact}</span>
        </div>
      );
    },
  },
];
