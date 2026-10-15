"use client";

import type { ClientContractStatus } from "@/api/clients/clients.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import {
  CLIENT_CONTRACT_STATUS_LABELS,
  CLIENT_CONTRACT_STATUS_STYLES,
} from "./const";

export function ClientContractStatusBadge({
  status,
  className,
}: {
  status: ClientContractStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        CLIENT_CONTRACT_STATUS_STYLES[status],
        className,
      )}
    >
      {CLIENT_CONTRACT_STATUS_LABELS[status]}
    </Badge>
  );
}
