"use client";

import { useAgentThread } from "@/api/agent/agent.get";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { peekAgentChat } from "@/lib/agent-chat";
import { AgentChat } from "./agent-chat";

export interface AgentSession {
  id: string;
  isNew: boolean;
}

export function AgentConversation({ session }: { session: AgentSession }) {
  const needsHistory = !session.isNew && !peekAgentChat(session.id);
  const { data, isLoading, isError } = useAgentThread(
    needsHistory ? session.id : null,
  );

  if (needsHistory && isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="ml-auto h-9 w-2/3 rounded-2xl" />
        <Skeleton className="h-20 w-5/6" />
        <Skeleton className="ml-auto h-9 w-1/2 rounded-2xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (needsHistory && isError) {
    return (
      <p className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        No se pudo cargar la conversación.
      </p>
    );
  }

  return (
    <AgentChat
      key={session.id}
      threadId={session.id}
      initialMessages={data?.messages ?? []}
    />
  );
}
