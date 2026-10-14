"use client";

import type { AgentUIMessage } from "@/api/agent/agent.types";
import { cn } from "@/lib/utils";
import { AgentMarkdown } from "./agent-markdown";
import { NexoAvatar } from "./nexo-avatar";
import { AgentToolPart } from "./parts/agent-tool-part";

function UserMessage({ message }: { message: AgentUIMessage }) {
  const text = message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
        {text}
      </p>
    </div>
  );
}

export function AgentMessage({ message }: { message: AgentUIMessage }) {
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
      </div>
    </div>
  );
}

function AssistantAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-950 ring-1 ring-primary/30",
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
      <AssistantAvatar className="motion-safe:animate-nexo-float" />
      <div className="flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
