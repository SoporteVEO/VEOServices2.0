"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { FleetVehicle } from "@/api/fleet/fleet.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatBriloShortDate } from "@/lib/format";
import { formatCost, formatKm, vehicleName } from "./fleet-const";
import { FleetVehiclePhoto } from "./fleet-vehicle-photo";

export const FLEET_VEHICLES_COLUMNS: ColumnDef<FleetVehicle>[] = [
  {
    accessorKey: "plate",
    header: "Vehículo",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2.5">
        <FleetVehiclePhoto
          url={row.original.photoUrl}
          alt={vehicleName(row.original)}
          className="size-10"
          sizes="40px"
        />
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5 font-mono text-xs font-medium">
            {row.original.plate}
            {row.original.archived ? (
              <Badge variant="secondary" className="text-[10px]">
                Archivado
              </Badge>
            ) : null}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {vehicleName(row.original)}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "lastMaintenanceKm",
    header: "Km último mantenimiento",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs tabular-nums">
        {formatKm(row.original.lastMaintenanceKm)}
      </span>
    ),
  },
  {
    accessorKey: "lastMaintenanceAt",
    header: "Último mantenimiento",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {formatBriloShortDate(row.original.lastMaintenanceAt)}
      </span>
    ),
  },
  {
    id: "nextService",
    header: "Próximo servicio",
    cell: ({ row }) => {
      const { nextServiceKm, nextServiceAt } = row.original;
      const parts = [
        nextServiceKm != null ? formatKm(nextServiceKm) : null,
        nextServiceAt ? formatBriloShortDate(nextServiceAt) : null,
      ].filter(Boolean);
      return (
        <span className="whitespace-nowrap text-xs">
          {parts.length > 0 ? parts.join(" · ") : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "serviceCount",
    header: "Mantenimientos",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.serviceCount}</Badge>
    ),
  },
  {
    accessorKey: "totalSpent",
    header: "Total gastado",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs font-medium tabular-nums">
        {formatCost(row.original.totalSpent)}
      </span>
    ),
  },
];
