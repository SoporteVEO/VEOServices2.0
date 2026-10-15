"use client";

import type { ClientType } from "@/api/clients/clients.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import { CLIENT_TYPE_LABELS, CLIENT_TYPE_STYLES } from "./const";

export function ClientTypeBadge({
  type,
  className,
}: {
  type: ClientType;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        CLIENT_TYPE_STYLES[type],
        className,
      )}
    >
      {CLIENT_TYPE_LABELS[type]}
    </Badge>
  );
}
