import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { AGENT_ISSUES_QUERY_KEY } from "./agent-issues.get";
import type { AgentIssue, UpdateAgentIssueInput } from "./agent-issues.types";

export async function updateAgentIssue(
  id: string,
  input: UpdateAgentIssueInput,
): Promise<AgentIssue> {
  const response = await apiFetch<{ data: AgentIssue }>(
    `/development/agent-issues/${id}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  return response.data;
}

export function useUpdateAgentIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAgentIssueInput }) =>
      updateAgentIssue(id, input),
    onSuccess: async (updated) => {
      queryClient.setQueryData(
        [...AGENT_ISSUES_QUERY_KEY, "detail", updated.id],
        updated,
      );
      await queryClient.invalidateQueries({
        queryKey: [...AGENT_ISSUES_QUERY_KEY, "list"],
      });
    },
  });
}
