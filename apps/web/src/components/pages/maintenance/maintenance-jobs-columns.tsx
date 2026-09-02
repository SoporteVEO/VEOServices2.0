"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Camera, MapPin } from "lucide-react";
import type { MaintenanceJobListItem } from "@/api/maintenance/maintenance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatBriloShortDate } from "@/lib/format";
import { MaintenanceCategoryBadge } from "./maintenance-category-badge";
import { personName } from "./maintenance-const";
import { MaintenanceStatusBadge } from "./maintenance-status-badge";

export const MAINTENANCE_JOBS_COLUMNS: ColumnDef<MaintenanceJobListItem>[] = [
  {
    accessorKey: "code",
    header: "Orden",
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="font-mono text-xs font-medium">{row.original.code}</span>
        <span className="truncate text-xs text-muted-foreground">
          {row.original.billboardCode ?? "Sin código de valla"}
        </span>
      </div>
    ),
  },
  {
    id: "location",
    header: "Ubicación",
    cell: ({ row }) => {
      const parts = [
        row.original.address,
        row.original.cityName,
        row.original.departmentName,
      ].filter(Boolean);
      return (
        <div className="flex min-w-0 items-start gap-1.5">
          <MapPin
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="line-clamp-2 max-w-70 text-xs">
            {parts.length > 0 ? parts.join(", ") : "—"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Problema",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-80 text-xs">
        {row.original.description}
      </span>
    ),
  },
  {
    id: "category",
    header: "Categoría",
    cell: ({ row }) => <MaintenanceCategoryBadge category={row.original.category} />,
  },
  {
    id: "assignedUser",
    header: "Asignada a",
    cell: ({ row }) => (
      <span className="truncate text-xs">
        {personName(row.original.assignedUser)}
      </span>
    ),
  },
  {
    accessorKey: "scheduledAt",
    header: "Programada",
    cell: ({ row }) => {
      const overdue = row.original.isOverdue;
      return (
        <div className="flex items-center gap-1.5 whitespace-nowrap text-xs">
          {overdue ? (
            <AlertTriangle
              className="size-3.5 shrink-0 text-red-600 dark:text-red-400"
              aria-hidden
            />
          ) : null}
          <span className={overdue ? "text-red-600 dark:text-red-400" : ""}>
            {formatBriloShortDate(row.original.scheduledAt)}
          </span>
        </div>
      );
    },
  },
  {
    id: "photoCount",
    header: "Evidencia",
    cell: ({ row }) => (
      <Badge variant="secondary" className="gap-1">
        <Camera className="size-3" aria-hidden />
        {row.original.photoCount}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => <MaintenanceStatusBadge status={row.original.status} />,
  },
];
