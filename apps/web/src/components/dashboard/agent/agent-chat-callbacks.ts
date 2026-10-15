import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AGENT_QUERY_KEYS } from "@/api/agent/agent.get";
import { getAgentErrorMessage } from "@/lib/agent-chat";

export function agentChatCallbacks(queryClient: QueryClient) {
  return {
    onFinish: (id: string) => {
      void queryClient.invalidateQueries({
        queryKey: AGENT_QUERY_KEYS.threads,
      });
      queryClient.removeQueries({ queryKey: AGENT_QUERY_KEYS.thread(id) });
    },
    onError: (error: Error) => {
      toast.error(getAgentErrorMessage(error));
    },
  };
}
