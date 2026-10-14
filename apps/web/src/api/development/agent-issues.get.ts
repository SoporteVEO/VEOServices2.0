import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  AgentIssue,
  AgentIssueSeverity,
  AgentIssueStatus,
  PaginatedAgentIssues,
} from "./agent-issues.types";

export const AGENT_ISSUES_QUERY_KEY = ["development", "agent-issues"] as const;

export interface ListAgentIssuesQuery {
  status?: AgentIssueStatus;
  severity?: AgentIssueSeverity;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getAgentIssues(
  query: ListAgentIssuesQuery,
): Promise<PaginatedAgentIssues> {
  const params: Record<string, string> = {};
  if (query.status) params.status = query.status;
  if (query.severity) params.severity = query.severity;
  if (query.search) params.search = query.search;
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.pageSize = String(query.pageSize);
  return apiFetch<PaginatedAgentIssues>("/development/agent-issues", {
    method: "GET",
    query: params,
  });
}

export function useAgentIssues(query: ListAgentIssuesQuery) {
  return useQuery({
    queryKey: [...AGENT_ISSUES_QUERY_KEY, "list", query],
    queryFn: () => getAgentIssues(query),
    placeholderData: keepPreviousData,
  });
}

export async function getAgentIssue(id: string): Promise<AgentIssue> {
  const response = await apiFetch<{ data: AgentIssue }>(
    `/development/agent-issues/${id}`,
  );
  return response.data;
}

export function useAgentIssue(id: string | null) {
  return useQuery({
    queryKey: [...AGENT_ISSUES_QUERY_KEY, "detail", id],
    queryFn: () => getAgentIssue(id as string),
    enabled: !!id,
  });
}
