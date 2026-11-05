import { CircleCheck, Clock } from "lucide-react";
import type {
  MentorshipStartOutcome,
  MentorshipStatus,
} from "@/api/mentorships/mentorships.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import {
  OUTCOME_LABELS,
  OUTCOME_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "./const";

export function MentorshipStatusBadge({ status }: { status: MentorshipStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", STATUS_STYLES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function StartOutcomeBadge({
  outcome,
  prefix = "Start anterior:",
}: {
  outcome: MentorshipStartOutcome;
  prefix?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", OUTCOME_STYLES[outcome])}
    >
      {prefix ? `${prefix} ` : ""}
      {OUTCOME_LABELS[outcome]}
    </Badge>
  );
}

export function AcknowledgementBadge({
  acknowledgedAt,
}: {
  acknowledgedAt: string | null;
}) {
  return acknowledgedAt ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
      <CircleCheck className="size-3" />
      Confirmada
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
      <Clock className="size-3" />
      Sin confirmar
    </span>
  );
}
