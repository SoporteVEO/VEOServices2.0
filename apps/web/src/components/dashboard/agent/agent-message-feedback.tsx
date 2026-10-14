"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useAgentThreadFeedback } from "@/api/agent/agent.get";
import {
  type RateAgentMessageInput,
  useRateAgentMessage,
} from "@/api/agent/agent.mutations";
import { cn } from "@/lib/utils";
import { useAgentChatActions } from "./agent-chat-context";
import { AgentDislikeDialog } from "./agent-dislike-dialog";
import { AgentIconButton } from "./agent-icon-button";

export function AgentMessageFeedback({ messageId }: { messageId: string }) {
  const { threadId } = useAgentChatActions();
  const { data } = useAgentThreadFeedback(threadId);
  const rate = useRateAgentMessage(threadId);
  const [dislikeOpen, setDislikeOpen] = useState(false);

  const rating = data?.find((f) => f.messageId === messageId)?.rating ?? null;

  function save(input: Omit<RateAgentMessageInput, "messageId">, done?: string) {
    rate.mutate(
      { messageId, ...input },
      {
        onSuccess: () => {
          if (done) toast.success(done);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="-ml-1.5 flex items-center gap-0.5 text-muted-foreground">
      <AgentIconButton
        label={rating === "LIKE" ? "Quitar me gusta" : "Buena respuesta"}
        icon={ThumbsUp}
        aria-pressed={rating === "LIKE"}
        className={cn("size-7", rating === "LIKE" && "text-primary")}
        iconClassName={cn("size-3.5", rating === "LIKE" && "fill-current")}
        onClick={() =>
          save(
            { rating: rating === "LIKE" ? null : "LIKE" },
            rating === "LIKE" ? undefined : "¡Gracias! Nexo aprenderá de esto.",
          )
        }
      />
      <AgentIconButton
        label={rating === "DISLIKE" ? "Quitar no me gusta" : "Mala respuesta"}
        icon={ThumbsDown}
        aria-pressed={rating === "DISLIKE"}
        className={cn("size-7", rating === "DISLIKE" && "text-destructive")}
        iconClassName={cn("size-3.5", rating === "DISLIKE" && "fill-current")}
        onClick={() =>
          rating === "DISLIKE"
            ? save({ rating: null })
            : setDislikeOpen(true)
        }
      />
      <AgentDislikeDialog
        open={dislikeOpen}
        onOpenChange={setDislikeOpen}
        onSubmit={(feedback) => {
          setDislikeOpen(false);
          save(
            { rating: "DISLIKE", ...feedback },
            "Gracias, lo usaremos para mejorar a Nexo.",
          );
        }}
      />
    </div>
  );
}
