"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { formatShortDate } from "@/lib/format";
import type { EndingSoonContract } from "@/api/contracts/contracts.get";

export function ContractsTable({
  contracts,
  isLoading = false,
}: {
  contracts: EndingSoonContract[];
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return contracts;
    const q = search.toLowerCase();
    return contracts.filter(
      (c) =>
        c.contractNumber?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.customerEmail?.toLowerCase().includes(q) ||
        c.billboardAddress?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [contracts, search]);

  const columns = useMemo<ColumnDef<EndingSoonContract>[]>(
    () => [
      {
        accessorKey: "contractNumber",
        header: "Codigo",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.contractNumber}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Atencion",
        cell: ({ row }) => row.original.description ?? "—",
      },
      {
        accessorKey: "customerName",
        header: "Cliente",
      },
      {
        accessorKey: "customerEmail",
        header: "Correo",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.customerEmail}
          </span>
        ),
      },
      {
        accessorKey: "billboardAddress",
        header: "Direccion valla",
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-40 truncate">
                {row.original.billboardAddress}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {row.original.billboardAddress}
            </TooltipContent>
          </Tooltip>
        ),
      },
      {
        accessorKey: "endDate",
        header: "Vencimiento",
        cell: ({ row }) => formatShortDate(new Date(row.original.endDate)),
      },
    ],
    [],
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Input
          placeholder="Buscar contratos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          isSearch
        />
        <div className="rounded-lg border">
          <DataTable columns={columns} data={filtered} isLoading={isLoading} />
        </div>
      </div>
    </TooltipProvider>
  );
}
