"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createAgentThreadId,
  forgetAgentChat,
  getAgentChat,
} from "@/lib/agent-chat";
import { agentChatCallbacks } from "./agent-chat-callbacks";
import type { AgentSession } from "./agent-conversation";

export type AgentPanelView = "chat" | "history";

export interface AskAgentOptions {
  prompt: string;
  /** `false` only prefills the composer so the user can complete the prompt. */
  send?: boolean;
}

interface AgentPanelState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  view: AgentPanelView;
  setView: (view: AgentPanelView) => void;
  session: AgentSession;
  startNewChat: () => void;
  selectThread: (id: string) => void;
  handleDeleted: (id: string) => void;
  ask: (options: AskAgentOptions) => void;
}

const AgentPanelContext = createContext<AgentPanelState | null>(null);

function newSession(): AgentSession {
  return { id: createAgentThreadId(), isNew: true };
}

export function AgentPanelProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AgentPanelView>("chat");
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

  function ask({ prompt, send = true }: AskAgentOptions) {
    const next = newSession();
    if (send) {
      const chat = getAgentChat(next.id, [], agentChatCallbacks(queryClient));
      void chat.sendMessage({ text: prompt });
      setSession(next);
    } else {
      setSession({ ...next, draft: prompt });
    }
    setView("chat");
    setOpen(true);
  }

  const value: AgentPanelState = {
    open,
    setOpen,
    toggle: () => setOpen((current) => !current),
    view,
    setView,
    session,
    startNewChat: () => {
      setSession(newSession());
      setView("chat");
    },
    selectThread: (id) => {
      setSession({ id, isNew: false });
      setView("chat");
    },
    handleDeleted: (id) => {
      forgetAgentChat(id);
      if (id === session.id) setSession(newSession());
    },
    ask,
  };

  return <AgentPanelContext value={value}>{children}</AgentPanelContext>;
}

export function useAgentPanel() {
  const value = use(AgentPanelContext);
  if (!value)
    throw new Error("useAgentPanel must be used inside AgentPanelProvider");
  return value;
}
