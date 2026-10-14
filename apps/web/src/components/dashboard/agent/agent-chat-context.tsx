"use client";

import { createContext, use } from "react";

interface AgentChatActions {
  respondToApproval: (id: string, approved: boolean) => void;
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
