"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Image as ImageIcon, Monitor } from "lucide-react";
import { Badge } from "@/components/primitives/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { formatShortDate } from "@/lib/format";
import type { ActiveContract } from "@/api/contracts/contracts.get";
import { MaintenanceContractDrawer } from "./maintenance-contract-drawer";
import { groupContractsByNumber, type MaintenanceContractGroup } from "./group";

export function MaintenanceContractsTable({
  contracts,
  isLoading = false,
}: {
  contracts: ActiveContract[];
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MaintenanceContractGroup | null>(
    null,
  );

  const groups = useMemo(() => groupContractsByNumber(contracts), [contracts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (group) =>
        group.contractNumber?.toLowerCase().includes(q) ||
        group.customerName?.toLowerCase().includes(q) ||
        group.customerEmail?.toLowerCase().includes(q) ||
        group.description?.toLowerCase().includes(q) ||
        group.billboards.some((b) =>
          b.billboardCode?.toLowerCase().includes(q),
        ),
    );
  }, [groups, search]);

  const columns = useMemo<ColumnDef<MaintenanceContractGroup>[]>(
    () => [
      {
        accessorKey: "contractNumber",
        header: "Contrato",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.contractNumber}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Atención",
        cell: ({ row }) => row.original.description ?? "—",
      },
      {
        accessorKey: "customerName",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate">{row.original.customerName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.customerEmail}
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
        id: "images",
        header: "Imágenes",
        cell: ({ row }) => {
          const { billboardsWithImages, totalBillboards, totalImages } =
            row.original;
          const isComplete = billboardsWithImages === totalBillboards;
          const hasNone = totalImages === 0;
          return (
            <Badge
              variant={
                hasNone ? "destructive" : isComplete ? "default" : "secondary"
              }
              className="gap-1"
            >
              <ImageIcon className="size-3" aria-hidden />
              {billboardsWithImages} / {totalBillboards}
            </Badge>
          );
        },
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
    <>
      <div className="space-y-4">
        <Input
          placeholder="Buscar por contrato, cliente, valla..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          isSearch
        />
        <div className="rounded-lg border">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            onRowClick={setSelected}
            emptyMessage="No hay contratos activos en este período."
          />
        </div>
      </div>

      <MaintenanceContractDrawer
        group={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
