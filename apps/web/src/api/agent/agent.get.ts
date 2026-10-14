import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  AgentCapabilities,
  AgentThreadDetail,
  AgentThreadSummary,
} from "./agent.types";

export const AGENT_QUERY_KEYS = {
  threads: ["agent", "threads"] as const,
  thread: (id: string) => ["agent", "threads", id] as const,
  capabilities: ["agent", "capabilities"] as const,
};

export async function getAgentThreads() {
  const response = await apiFetch<{ data: AgentThreadSummary[] }>(
    "/agent/threads",
  );
  return response.data;
}

export function useAgentThreads(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.threads,
    queryFn: getAgentThreads,
    enabled: options?.enabled ?? true,
  });
}

export async function getAgentThread(id: string) {
  const response = await apiFetch<{ data: AgentThreadDetail }>(
    `/agent/threads/${id}`,
  );
  return response.data;
}

/** `null` for a conversation that has not sent its first message yet. */
export function useAgentThread(id: string | null) {
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.thread(id ?? "new"),
    queryFn: () => getAgentThread(id!),
    enabled: id != null,
    staleTime: Infinity,
  });
}

export async function getAgentCapabilities() {
  const response = await apiFetch<{ data: AgentCapabilities }>(
    "/agent/capabilities",
  );
  return response.data;
}

export function useAgentCapabilities() {
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.capabilities,
    queryFn: getAgentCapabilities,
    staleTime: 5 * 60 * 1000,
  });
}
