"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Mail, Phone, User } from "lucide-react";

import type { Client } from "@/api/clients/clients.types";
import { formatShortDate } from "@/lib/format";

export const CLIENTS_COLUMNS: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <User className="size-3.5" />
        </span>
        <span className="truncate font-medium">{row.original.name}</span>
      </div>
    ),
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
    header: "Contacto",
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
  {
    accessorKey: "createdAt",
    header: "Registrado",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {formatShortDate(new Date(row.original.createdAt))}
      </span>
    ),
  },
];
