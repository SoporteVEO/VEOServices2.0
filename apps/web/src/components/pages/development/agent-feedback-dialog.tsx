"use client";

import { RotateCcw, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { useAgentFeedbackDetail } from "@/api/development/agent-learnings.get";
import { useReviewAgentFeedback } from "@/api/development/agent-learnings.mutations";
import type {
  AgentFeedbackDetail,
  AgentFeedbackReview,
} from "@/api/development/agent-learnings.types";
import { AgentMarkdown } from "@/components/dashboard/agent/agent-markdown";
import { FEEDBACK_REASON_LABELS } from "@/components/dashboard/agent/agent-feedback-const";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Block } from "./agent-issue-summary";
import { AgentLearningActions } from "./agent-learning-actions";
import {
  FeedbackRatingIcon,
  FeedbackReviewBadge,
  LearningStatusBadge,
} from "./agent-learning-badges";
import { CodeBlock } from "./agent-issue-code-block";
import { formatIssueDateTime, issueUserName } from "./const";

type Props = {
  feedbackId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function AgentFeedbackDialog({ feedbackId, onOpenChange }: Props) {
  return (
    <Dialog open={!!feedbackId} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        {feedbackId ? <FeedbackBody feedbackId={feedbackId} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FeedbackBody({ feedbackId }: { feedbackId: string }) {
  const { data, isLoading, isError } = useAgentFeedbackDetail(feedbackId);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Cargando"
        className="flex flex-col gap-5 p-6"
      >
        <DialogTitle className="sr-only">Cargando calificación</DialogTitle>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5.5 w-20" />
          </div>
          <Skeleton className="h-3.5 w-56" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="p-6">
        <DialogTitle className="sr-only">Error</DialogTitle>
        <p className="text-sm text-muted-foreground">
          No pudimos cargar esta calificación.
        </p>
      </div>
    );
  }
  return <FeedbackContent feedback={data} />;
}

function FeedbackContent({ feedback }: { feedback: AgentFeedbackDetail }) {
  const review = useReviewAgentFeedback();

  function setReview(next: AgentFeedbackReview, message: string) {
    review.mutate(
      { id: feedback.id, review: next },
      {
        onSuccess: () => toast.success(message),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          <FeedbackRatingIcon rating={feedback.rating} />
          {feedback.rating === "LIKE" ? "Buena respuesta" : "Mala respuesta"}
          {feedback.reason ? (
            <span className="text-sm font-normal text-muted-foreground">
              · {FEEDBACK_REASON_LABELS[feedback.reason]}
            </span>
          ) : null}
          <FeedbackReviewBadge review={feedback.review} />
        </DialogTitle>
        <DialogDescription>
          {issueUserName(feedback.user)} ·{" "}
          {formatIssueDateTime(feedback.createdAt)}
          {feedback.model ? ` · ${feedback.model}` : ""}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="flex flex-col gap-3">
        <Block title="Pregunta">
          <p className="whitespace-pre-wrap text-sm">
            {feedback.question || "—"}
          </p>
        </Block>
        {feedback.comment ? (
          <Block title="Comentario del usuario">
            <p className="whitespace-pre-wrap rounded-md border-l-2 border-primary/40 pl-3 text-sm italic">
              {feedback.comment}
            </p>
          </Block>
        ) : null}
        <Block title="Respuesta de Nexo">
          <div className="text-sm">
            {feedback.answer ? (
              <AgentMarkdown text={feedback.answer} />
            ) : (
              <span className="text-muted-foreground">
                Sin texto (solo herramientas)
              </span>
            )}
          </div>
        </Block>
        {feedback.toolCalls.length ? (
          <Block title="Herramientas usadas">
            <div className="flex flex-col gap-2">
              {feedback.toolCalls.map((call, index) => (
                <CodeBlock
                  key={`${call.tool}-${index}`}
                  label={call.tool}
                  value={call.input}
                />
              ))}
            </div>
          </Block>
        ) : null}
        <Block title="Aprendizajes propuestos">
          {feedback.learnings.length ? (
            <ul className="flex flex-col gap-2">
              {feedback.learnings.map((learning) => (
                <li
                  key={learning.id}
                  className="flex flex-col gap-2 rounded-md border p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span>{learning.content}</span>
                    <LearningStatusBadge status={learning.status} />
                  </div>
                  <AgentLearningActions
                    id={learning.id}
                    status={learning.status}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nexo no encontró una lección generalizable en esta calificación.
            </p>
          )}
        </Block>
      </DialogBody>

      <DialogFooter className="flex-wrap sm:justify-between">
        <p className="self-center text-xs text-muted-foreground">
          ¿La calificación del usuario es correcta?
        </p>
        <div className="flex flex-wrap gap-2">
          {feedback.review !== "PENDING" ? (
            <Button
              variant="ghost"
              icon={RotateCcw}
              disabled={review.isPending}
              onClick={() => setReview("PENDING", "Marcada como sin revisar")}
            >
              Sin revisar
            </Button>
          ) : null}
          <Button
            variant="outline"
            icon={UserX}
            disabled={review.isPending || feedback.review === "DISMISSED"}
            onClick={() =>
              setReview(
                "DISMISSED",
                "Calificación descartada; Nexo ya no la tomará en cuenta",
              )
            }
          >
            El usuario se equivocó
          </Button>
          <Button
            icon={UserCheck}
            disabled={review.isPending || feedback.review === "CONFIRMED"}
            onClick={() => setReview("CONFIRMED", "Calificación confirmada")}
          >
            El usuario tiene razón
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
