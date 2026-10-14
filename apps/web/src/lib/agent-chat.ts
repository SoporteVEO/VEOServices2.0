import { Chat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import type { AgentUIMessage } from "@/api/agent/agent.types";
import { AGENT_NAME } from "@/lib/agent-brand";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const chats = new Map<string, Chat<AgentUIMessage>>();

const transport = new DefaultChatTransport<AgentUIMessage>({
  api: `${API_URL}/agent/chat`,
  headers: (): Record<string, string> => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("bearer_token")
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  prepareSendMessagesRequest: ({ id, messages }) => ({
    body: { id, message: messages[messages.length - 1] },
  }),
});

interface AgentChatCallbacks {
  onFinish: (chatId: string) => void;
  onError: (error: Error) => void;
}

export function peekAgentChat(id: string) {
  return chats.get(id);
}

export function getAgentChat(
  id: string,
  messages: AgentUIMessage[],
  callbacks: AgentChatCallbacks,
) {
  const existing = chats.get(id);
  if (existing) return existing;

  const chat = new Chat<AgentUIMessage>({
    id,
    messages,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: () => callbacks.onFinish(id),
    onError: callbacks.onError,
  });
  chats.set(id, chat);
  return chat;
}

export function forgetAgentChat(id: string) {
  const chat = chats.get(id);
  if (chat && (chat.status === "streaming" || chat.status === "submitted")) {
    void chat.stop();
  }
  chats.delete(id);
}

export function createAgentThreadId() {
  return crypto.randomUUID();
}

export function getAgentErrorMessage(error: Error | undefined) {
  if (!error) return null;
  try {
    const parsed = JSON.parse(error.message) as { message?: string | string[] };
    const message = Array.isArray(parsed.message)
      ? parsed.message.join(", ")
      : parsed.message;
    if (message) return message;
  } catch {
    // not a JSON error body
  }
  return error.message || `Ocurrió un error al contactar a ${AGENT_NAME}.`;
}
