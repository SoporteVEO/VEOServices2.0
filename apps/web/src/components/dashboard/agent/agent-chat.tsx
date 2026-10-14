"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AGENT_QUERY_KEYS } from "@/api/agent/agent.get";
import type { AgentUIMessage } from "@/api/agent/agent.types";
import { Button } from "@/components/ui/button";
import { getAgentChat, getAgentErrorMessage } from "@/lib/agent-chat";
import { AgentChatActionsContext } from "./agent-chat-context";
import { AgentComposer } from "./agent-composer";
import { AgentEmptyState } from "./agent-empty-state";
import { AgentMessage, AgentThinking } from "./agent-message";

interface AgentChatProps {
  threadId: string;
  initialMessages: AgentUIMessage[];
}

export function AgentChat({ threadId, initialMessages }: AgentChatProps) {
  const queryClient = useQueryClient();

  const chat = getAgentChat(threadId, initialMessages, {
    onFinish: (id) => {
      void queryClient.invalidateQueries({
        queryKey: AGENT_QUERY_KEYS.threads,
      });
      queryClient.removeQueries({ queryKey: AGENT_QUERY_KEYS.thread(id) });
    },
    onError: (error) => {
      toast.error(getAgentErrorMessage(error));
    },
  });

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
    addToolApprovalResponse,
  } = useChat<AgentUIMessage>({ chat });

  const isBusy = status === "submitted" || status === "streaming";
  const last = messages[messages.length - 1];
  const showThinking =
    status === "submitted" ||
    (status === "streaming" && last?.role !== "assistant");

  function send(text: string) {
    void sendMessage({ text });
  }

  const actions = {
    isBusy,
    respondToApproval: (id: string, approved: boolean) => {
      void addToolApprovalResponse({ id, approved });
    },
  };

  return (
    <AgentChatActionsContext value={actions}>
      <div className="flex min-h-0 flex-1 flex-col">
        {messages.length === 0 ? (
          <div className="flex min-h-0 flex-1 overflow-y-auto">
            <AgentEmptyState onPick={send} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
            <div className="flex flex-col gap-5 px-4 py-4">
              {messages.map((message) => (
                <AgentMessage key={message.id} message={message} />
              ))}
              {showThinking ? <AgentThinking /> : null}
              {status === "error" ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <span className="flex items-center gap-2">
                    <CircleAlert className="size-4 shrink-0" />
                    {getAgentErrorMessage(error)}
                  </span>
                  <Button
                    variant="ghost"
                    sizeVariant="sm"
                    icon={RotateCcw}
                    onClick={() => void regenerate()}
                  >
                    Reintentar
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}
        <AgentComposer
          isBusy={isBusy}
          onSend={send}
          onStop={() => void stop()}
        />
      </div>
    </AgentChatActionsContext>
  );
}
