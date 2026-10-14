import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AGENT_QUERY_KEYS } from "./agent.get";

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
