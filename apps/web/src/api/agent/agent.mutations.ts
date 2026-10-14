import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toClientError } from "@/lib/api";
import { AGENT_QUERY_KEYS } from "./agent.get";
import type {
  AgentFeedbackRating,
  AgentFeedbackReason,
  AgentMessageFeedback,
} from "./agent.types";

export function useDeleteAgentThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/agent/threads/${id}`);
      return id;
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: AGENT_QUERY_KEYS.thread(id) });
      return qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.threads });
    },
  });
}

export function useRenameAgentThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await api.patch(`/agent/threads/${id}`, { title });
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.threads }),
  });
}

export interface RateAgentMessageInput {
  messageId: string;
  /** `null` removes the rating. */
  rating: AgentFeedbackRating | null;
  reason?: AgentFeedbackReason;
  comment?: string;
}

export function useRateAgentMessage(threadId: string) {
  const qc = useQueryClient();
  const queryKey = AGENT_QUERY_KEYS.feedback(threadId);

  return useMutation({
    mutationFn: async ({ messageId, ...body }: RateAgentMessageInput) => {
      const url = `/agent/threads/${threadId}/messages/${messageId}/feedback`;
      try {
        if (!body.rating) {
          await api.delete(url);
          return;
        }
        await api.put(url, body);
      } catch (error) {
        throw toClientError(error, "No se pudo guardar tu calificación");
      }
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<AgentMessageFeedback[]>(queryKey);
      qc.setQueryData<AgentMessageFeedback[]>(queryKey, (list = []) => [
        ...list.filter((f) => f.messageId !== input.messageId),
        ...(input.rating
          ? [
              {
                messageId: input.messageId,
                rating: input.rating,
                reason: input.reason ?? null,
                comment: input.comment ?? null,
              },
            ]
          : []),
      ]);
      return { previous };
    },
    onError: (_error, _input, context) => {
      qc.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });
}
