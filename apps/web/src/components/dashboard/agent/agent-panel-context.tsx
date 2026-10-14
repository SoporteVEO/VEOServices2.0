"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { createAgentThreadId, forgetAgentChat } from "@/lib/agent-chat";
import type { AgentSession } from "./agent-conversation";

interface AgentPanelState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  session: AgentSession;
  startNewChat: () => void;
  selectThread: (id: string) => void;
  handleDeleted: (id: string) => void;
}

const AgentPanelContext = createContext<AgentPanelState | null>(null);

function newSession(): AgentSession {
  return { id: createAgentThreadId(), isNew: true };
}

export function AgentPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<AgentSession>(newSession);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const value: AgentPanelState = {
    open,
    setOpen,
    toggle: () => setOpen((current) => !current),
    session,
    startNewChat: () => setSession(newSession()),
    selectThread: (id) => setSession({ id, isNew: false }),
    handleDeleted: (id) => {
      forgetAgentChat(id);
      if (id === session.id) setSession(newSession());
    },
  };

  return <AgentPanelContext value={value}>{children}</AgentPanelContext>;
}

export function useAgentPanel() {
  const value = use(AgentPanelContext);
  if (!value)
    throw new Error("useAgentPanel must be used inside AgentPanelProvider");
  return value;
}
