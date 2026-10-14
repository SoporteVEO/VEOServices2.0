"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AgentIconButton } from "./agent-icon-button";
import { AGENT_NAME } from "@/lib/agent-brand";

interface AgentComposerProps {
  isBusy: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function AgentComposer({
  isBusy,
  disabled,
  onSend,
  onStop,
}: AgentComposerProps) {
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0 && !isBusy && !disabled;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-border bg-card p-3">
      <div className="relative">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Pregúntale algo a ${AGENT_NAME}…`}
          rows={2}
          maxLength={4000}
          disabled={disabled}
          className="max-h-40 min-h-16 resize-none pr-12"
          aria-label={`Mensaje para ${AGENT_NAME}`}
        />
        {isBusy ? (
          <AgentIconButton
            type="button"
            variant="secondary"
            label="Detener respuesta"
            className="absolute bottom-2 right-2"
            icon={Square}
            iconClassName="size-3.5 fill-current"
            onClick={onStop}
          />
        ) : (
          <AgentIconButton
            type="submit"
            variant="default"
            label="Enviar (Enter)"
            className="absolute bottom-2 right-2"
            icon={ArrowUp}
            disabled={!canSend}
          />
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Enter para enviar · Shift + Enter para nueva línea
      </p>
    </form>
  );
}
