"use client";

import type { AgentUIMessage } from "@/api/agent/agent.types";
import { cn } from "@/lib/utils";
import { AgentMarkdown } from "./agent-markdown";
import { AgentMessageFeedback } from "./agent-message-feedback";
import { NexoAvatar } from "./nexo-avatar";
import { AgentToolPart } from "./parts/agent-tool-part";

function UserMessage({ message }: { message: AgentUIMessage }) {
  const text = message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] whitespace-pre-wrap border-r-2 border-veo-lime bg-primary px-3.5 py-2 text-sm leading-relaxed text-primary-foreground">
        {text}
      </p>
    </div>
  );
}

export function AgentMessage({
  message,
  showFeedback = false,
}: {
  message: AgentUIMessage;
  showFeedback?: boolean;
}) {
  if (message.role === "user") return <UserMessage message={message} />;

  return (
    <div className="flex items-start gap-2.5">
      <AssistantAvatar />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 pt-0.5">
        {message.parts.map((part, index) => {
          const key = `${message.id}-${index}`;
          if (part.type === "text") {
            return part.text.trim() ? (
              <AgentMarkdown key={key} text={part.text} />
            ) : null;
          }
          if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
            return <AgentToolPart key={key} part={part} />;
          }
          return null;
        })}
        {showFeedback ? <AgentMessageFeedback messageId={message.id} /> : null}
      </div>
    </div>
  );
}

function AssistantAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center bg-veo-dark ring-1 ring-veo-lime/40",
        className,
      )}
    >
      <NexoAvatar size={24} />
    </span>
  );
}

export function AgentThinking({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Pensando"
    >
      <AssistantAvatar />
      <div className="flex items-center gap-1">
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-square-blink bg-veo-gray dark:bg-veo-lime"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
