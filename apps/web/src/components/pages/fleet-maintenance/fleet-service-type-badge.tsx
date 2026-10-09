"use client";

import type { FleetServiceType } from "@/api/fleet/fleet.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import {
  FLEET_SERVICE_TYPE_LABELS,
  FLEET_SERVICE_TYPE_STYLES,
} from "./fleet-const";

export function FleetServiceTypeBadge({
  type,
  className,
}: {
  type: FleetServiceType;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        FLEET_SERVICE_TYPE_STYLES[type],
        className,
      )}
    >
      {FLEET_SERVICE_TYPE_LABELS[type]}
    </Badge>
  );
}
