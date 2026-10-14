import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  AGENT_FEEDBACK_QUERY_KEY,
  AGENT_LEARNINGS_QUERY_KEY,
} from "./agent-learnings.get";
import type {
  AgentFeedbackDetail,
  AgentFeedbackReview,
  AgentLearning,
  CreateAgentLearningInput,
  UpdateAgentLearningInput,
} from "./agent-learnings.types";

function useInvalidateLearning() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: AGENT_LEARNINGS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: AGENT_FEEDBACK_QUERY_KEY }),
    ]);
}

export function useCreateAgentLearning() {
  const invalidate = useInvalidateLearning();
  return useMutation({
    mutationFn: async (input: CreateAgentLearningInput) => {
      const response = await apiFetch<{ data: AgentLearning }>(
        "/development/agent-learnings",
        { method: "POST", body: JSON.stringify(input) },
      );
      return response.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateAgentLearning() {
  const invalidate = useInvalidateLearning();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAgentLearningInput;
    }) => {
      const response = await apiFetch<{ data: AgentLearning }>(
        `/development/agent-learnings/${id}`,
        { method: "PATCH", body: JSON.stringify(input) },
      );
      return response.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteAgentLearning() {
  const invalidate = useInvalidateLearning();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/development/agent-learnings/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useReviewAgentFeedback() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateLearning();
  return useMutation({
    mutationFn: async ({
      id,
      review,
    }: {
      id: string;
      review: AgentFeedbackReview;
    }) => {
      const response = await apiFetch<{ data: AgentFeedbackDetail }>(
        `/development/agent-feedback/${id}`,
        { method: "PATCH", body: JSON.stringify({ review }) },
      );
      return response.data;
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(
        [...AGENT_FEEDBACK_QUERY_KEY, "detail", updated.id],
        updated,
      );
      await invalidate();
    },
  });
}
