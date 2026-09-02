"use client";

import type { MaintenanceJobStatus } from "@/api/maintenance/maintenance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_STYLES,
} from "./maintenance-const";

export function MaintenanceStatusBadge({
  status,
  className,
}: {
  status: MaintenanceJobStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        MAINTENANCE_STATUS_STYLES[status],
        className,
      )}
    >
      {MAINTENANCE_STATUS_LABELS[status]}
    </Badge>
  );
}
