"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import type { FileUIPart } from "ai";
import { CircleAlert, RotateCcw } from "lucide-react";
import type {
  AgentDataSource,
  AgentUIMessage,
} from "@/api/agent/agent.types";
import { Button } from "@/components/ui/button";
import { getAgentChat, getAgentErrorMessage } from "@/lib/agent-chat";
import { agentChatCallbacks } from "./agent-chat-callbacks";
import { AgentChatActionsContext } from "./agent-chat-context";
import { AgentComposer } from "./agent-composer";
import { AgentEmptyState } from "./agent-empty-state";
import { AgentMessage, AgentThinking } from "./agent-message";

interface AgentChatProps {
  threadId: string;
  initialMessages: AgentUIMessage[];
  draft?: string;
}

const FILES_ONLY_PROMPT = "Revisa los archivos adjuntos.";

export function AgentChat({ threadId, initialMessages, draft }: AgentChatProps) {
  const queryClient = useQueryClient();

  const chat = getAgentChat(
    threadId,
    initialMessages,
    agentChatCallbacks(queryClient),
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
    addToolApprovalResponse,
    addToolOutput,
  } = useChat<AgentUIMessage>({ chat });

  const isBusy = status === "submitted" || status === "streaming";
  const last = messages[messages.length - 1];
  const showThinking =
    status === "submitted" ||
    (status === "streaming" && last?.role !== "assistant");

  function send(text: string, files: FileUIPart[] = []) {
    void sendMessage({
      text: text || FILES_ONLY_PROMPT,
      ...(files.length > 0 && { files }),
    });
  }

  const streamingId =
    isBusy && last?.role === "assistant" ? last.id : undefined;

  const actions = {
    threadId,
    isBusy,
    respondToApproval: (id: string, approved: boolean) => {
      void addToolApprovalResponse({ id, approved });
    },
    chooseDataSource: (toolCallId: string, source: AgentDataSource) => {
      void addToolOutput({
        tool: "ask_data_source",
        toolCallId,
        output: { source },
      });
    },
    sendText: (text: string) => send(text),
  };

  return (
    <AgentChatActionsContext value={actions}>
      <div className="flex min-h-0 flex-1 flex-col">
        {messages.length === 0 ? (
          <div className="flex min-h-0 flex-1 overflow-y-auto">
            <AgentEmptyState onPick={(prompt) => send(prompt)} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
            <div className="flex flex-col gap-5 px-4 py-4">
              {messages.map((message) => (
                <AgentMessage
                  key={message.id}
                  message={message}
                  showFeedback={message.id !== streamingId}
                />
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
          initialText={draft}
          onSend={send}
          onStop={() => void stop()}
        />
      </div>
    </AgentChatActionsContext>
  );
}
