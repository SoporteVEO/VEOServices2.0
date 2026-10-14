import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AgentFeedbackRating } from "@/api/agent/agent.types";
import { apiFetch } from "@/lib/api";
import type {
  AgentFeedbackDetail,
  AgentFeedbackReview,
  AgentLearningStatus,
  PaginatedAgentFeedback,
  PaginatedAgentLearnings,
} from "./agent-learnings.types";

export const AGENT_LEARNINGS_QUERY_KEY = [
  "development",
  "agent-learnings",
] as const;

export const AGENT_FEEDBACK_QUERY_KEY = [
  "development",
  "agent-feedback",
] as const;

interface PageQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAgentLearningsQuery extends PageQuery {
  status?: AgentLearningStatus;
}

export interface ListAgentFeedbackQuery extends PageQuery {
  rating?: AgentFeedbackRating;
  review?: AgentFeedbackReview;
}

function toParams(query: object): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );
}

export function useAgentLearnings(query: ListAgentLearningsQuery) {
  return useQuery({
    queryKey: [...AGENT_LEARNINGS_QUERY_KEY, "list", query],
    queryFn: () =>
      apiFetch<PaginatedAgentLearnings>("/development/agent-learnings", {
        query: toParams(query),
      }),
    placeholderData: keepPreviousData,
  });
}

export function useAgentFeedbackList(query: ListAgentFeedbackQuery) {
  return useQuery({
    queryKey: [...AGENT_FEEDBACK_QUERY_KEY, "list", query],
    queryFn: () =>
      apiFetch<PaginatedAgentFeedback>("/development/agent-feedback", {
        query: toParams(query),
      }),
    placeholderData: keepPreviousData,
  });
}

export function useAgentFeedbackDetail(id: string | null) {
  return useQuery({
    queryKey: [...AGENT_FEEDBACK_QUERY_KEY, "detail", id],
    queryFn: async () => {
      const response = await apiFetch<{ data: AgentFeedbackDetail }>(
        `/development/agent-feedback/${id}`,
      );
      return response.data;
    },
    enabled: !!id,
  });
}
