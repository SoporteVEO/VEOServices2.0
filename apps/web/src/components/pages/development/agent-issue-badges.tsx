import type {
  AgentIssueSeverity,
  AgentIssueStatus,
} from "@/api/development/agent-issues.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import {
  ISSUE_SEVERITY_LABELS,
  ISSUE_SEVERITY_STYLES,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_STYLES,
} from "./const";

export function IssueStatusBadge({ status }: { status: AgentIssueStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        ISSUE_STATUS_STYLES[status],
      )}
    >
      {ISSUE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function IssueSeverityBadge({
  severity,
}: {
  severity: AgentIssueSeverity;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        ISSUE_SEVERITY_STYLES[severity],
      )}
    >
      {ISSUE_SEVERITY_LABELS[severity]}
    </Badge>
  );
}
