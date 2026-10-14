import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { AgentFeedbackRating } from "@/api/agent/agent.types";
import type {
  AgentFeedbackReview,
  AgentLearningStatus,
} from "@/api/development/agent-learnings.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import {
  FEEDBACK_REVIEW_LABELS,
  FEEDBACK_REVIEW_STYLES,
  LEARNING_STATUS_LABELS,
  LEARNING_STATUS_STYLES,
} from "./learning-const";

export function LearningStatusBadge({
  status,
}: {
  status: AgentLearningStatus;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        LEARNING_STATUS_STYLES[status],
      )}
    >
      {LEARNING_STATUS_LABELS[status]}
    </Badge>
  );
}

export function FeedbackReviewBadge({
  review,
}: {
  review: AgentFeedbackReview;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        FEEDBACK_REVIEW_STYLES[review],
      )}
    >
      {FEEDBACK_REVIEW_LABELS[review]}
    </Badge>
  );
}

export function FeedbackRatingIcon({
  rating,
  className,
}: {
  rating: AgentFeedbackRating;
  className?: string;
}) {
  return rating === "LIKE" ? (
    <ThumbsUp
      className={cn("size-4 fill-current text-emerald-600", className)}
      aria-label="Me gusta"
    />
  ) : (
    <ThumbsDown
      className={cn("size-4 fill-current text-red-600", className)}
      aria-label="No me gusta"
    />
  );
}
