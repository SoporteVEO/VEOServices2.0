"use client";

import { createContext, use } from "react";
import type { AgentDataSource } from "@/api/agent/agent.types";

interface AgentChatActions {
  threadId: string;
  respondToApproval: (id: string, approved: boolean) => void;
  chooseDataSource: (toolCallId: string, source: AgentDataSource) => void;
  isBusy: boolean;
}

export const AgentChatActionsContext = createContext<AgentChatActions | null>(
  null,
);

export function useAgentChatActions() {
  const value = use(AgentChatActionsContext);
  if (!value)
    throw new Error("useAgentChatActions must be used inside AgentChat");
  return value;
}
