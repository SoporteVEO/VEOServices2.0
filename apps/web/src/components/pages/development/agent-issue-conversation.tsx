import type { AgentIssueDiagnostics } from "@/api/development/agent-issues.types";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./agent-issue-code-block";

type ConversationPart = {
  type?: string;
  text?: string;
  [key: string]: unknown;
};

export function AgentIssueConversation({
  conversation,
}: {
  conversation: AgentIssueDiagnostics["conversation"];
}) {
  if (!conversation?.length) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        No se guardó la conversación.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {conversation.map((message) => (
        <li
          key={message.id}
          className={cn(
            "flex flex-col gap-2 rounded-lg border p-3",
            message.role === "user" ? "bg-muted/40" : "bg-card",
          )}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {message.role === "user" ? "Usuario" : "Nexo"}
          </span>
          {(message.parts as ConversationPart[]).map((part, index) =>
            part.type === "text" ? (
              <p key={index} className="whitespace-pre-wrap text-sm">
                {part.text}
              </p>
            ) : (
              <CodeBlock key={index} label={part.type} value={part} />
            ),
          )}
        </li>
      ))}
    </ol>
  );
}
