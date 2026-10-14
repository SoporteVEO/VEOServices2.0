"use client";

import { ChevronRight, CircleAlert, CircleCheck } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/primitives/ui/collapsible";
import { cn } from "@/lib/utils";

interface AgentToolStatusProps {
  label: string;
  state: string;
  detail?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

function stringify(value: unknown) {
  if (value === undefined) return null;
  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return text.length > 6000 ? `${text.slice(0, 6000)}\n…` : text;
}

export function AgentToolStatus({
  label,
  state,
  detail,
  input,
  output,
  errorText,
}: AgentToolStatusProps) {
  const isRunning =
    state === "input-streaming" ||
    state === "input-available" ||
    state === "approval-responded";
  const failed =
    state === "output-error" ||
    state === "output-denied" ||
    (typeof output === "object" &&
      output !== null &&
      (output as { ok?: unknown }).ok === false);

  const Icon = failed ? CircleAlert : CircleCheck;
  const inputText = stringify(input);
  const outputText = stringify(errorText ?? output);

  return (
    <Collapsible className="w-full rounded-md border bg-muted/30 text-xs">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left">
        {isRunning ? (
          <span className="flex size-3.5 shrink-0 items-center justify-center">
            <span className="size-2 shrink-0 bg-veo-gray animate-square-blink" aria-hidden />
          </span>
        ) : (
          <Icon
            className={cn(
              "size-3.5 shrink-0",
              failed ? "text-amber-600" : "text-emerald-600",
            )}
          />
        )}
        <span className="font-medium">{label}</span>
        {detail ? (
          <span className="min-w-0 truncate font-mono text-muted-foreground">
            {detail}
          </span>
        ) : null}
        <ChevronRight className="ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t px-2.5 py-2">
        {inputText ? (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Entrada
            </p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-background p-2 font-mono text-[11px]">
              {inputText}
            </pre>
          </div>
        ) : null}
        {outputText ? (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Resultado
            </p>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all rounded bg-background p-2 font-mono text-[11px]">
              {outputText}
            </pre>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
