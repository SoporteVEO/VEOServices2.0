import type {
  FeatureRequestPriority,
  FeatureRequestStatus,
} from "@/api/feature-requests/feature-requests.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "./const";

export function FeatureRequestStatusBadge({
  status,
}: {
  status: FeatureRequestStatus;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", STATUS_STYLES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function FeatureRequestPriorityBadge({
  priority,
}: {
  priority: FeatureRequestPriority;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", PRIORITY_STYLES[priority])}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
