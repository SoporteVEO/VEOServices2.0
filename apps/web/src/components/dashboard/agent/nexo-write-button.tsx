"use client";

import { useState, type KeyboardEvent } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAgentCapabilities } from "@/api/agent/agent.get";
import { useAgentCompose } from "@/api/agent/agent.mutations";
import type {
  AgentComposeDraft,
  AgentComposeRequest,
} from "@/api/agent/agent.types";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_NAME } from "@/lib/agent-brand";
import { cn } from "@/lib/utils";
import { NEXO_ACCENT_CLASS } from "./ask-nexo-button";
import { NexoAvatar } from "./nexo-avatar";

interface NexoWriteButtonProps {
  kind: AgentComposeRequest["kind"];
  current: AgentComposeDraft;
  context?: Record<string, string>;
  suggestions?: string[];
  onApply: (draft: AgentComposeDraft) => void;
  className?: string;
}

const IMPROVE_SUGGESTIONS = ["Hazlo más breve", "Tono más cercano", "Mejora la redacción"];

export function NexoWriteButton({
  kind,
  current,
  context,
  suggestions = [],
  onApply,
  className,
}: NexoWriteButtonProps) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const compose = useAgentCompose();
  const { data: capabilities } = useAgentCapabilities();

  if (capabilities && !capabilities.enabled) return null;

  const hasDraft = current.body.trim().length > 0;
  const chips = hasDraft ? [...IMPROVE_SUGGESTIONS, ...suggestions] : suggestions;

  function generate(text = instruction) {
    const prompt = text.trim();
    if (prompt.length < 3 || compose.isPending) return;
    const previous = current;
    compose.mutate(
      { kind, instruction: prompt, current, context },
      {
        onSuccess: (draft) => {
          onApply({ subject: draft.subject || previous.subject, body: draft.body });
          setOpen(false);
          setInstruction("");
          toast.success(`${AGENT_NAME} redactó el texto`, {
            action: { label: "Deshacer", onClick: () => onApply(previous) },
          });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      generate();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          sizeVariant="sm"
          icon={Sparkles}
          iconClassName="text-veo-gray dark:text-veo-lime"
          className={cn(NEXO_ACCENT_CLASS, "h-7 text-xs", className)}
        >
          {hasDraft ? `Mejorar con ${AGENT_NAME}` : `Redactar con ${AGENT_NAME}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 gap-3 p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center bg-veo-dark">
            <NexoAvatar size={28} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {hasDraft ? "¿Qué cambio hago?" : "¿Qué quieres que escriba?"}
            </p>
            <p className="text-xs text-muted-foreground">
              {kind === "crm_template"
                ? "Uso variables para personalizar cada envío."
                : "Uso los datos del contacto y del negocio."}
            </p>
          </div>
        </div>
        <Textarea
          autoFocus
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          maxLength={1500}
          placeholder="Ej. Seguimiento a una cotización de 3 vallas en San Salvador, tono cercano"
          className="resize-none text-sm"
          disabled={compose.isPending}
        />
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <Badge
                key={chip}
                asChild
                variant="outline"
                className="cursor-pointer text-[11px] font-normal hover:bg-accent"
              >
                <button
                  type="button"
                  disabled={compose.isPending}
                  onClick={() => generate(chip)}
                >
                  {chip}
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
        <Button
          type="button"
          sizeVariant="sm"
          icon={Sparkles}
          className="justify-center"
          loading={compose.isPending}
          disabled={instruction.trim().length < 3}
          onClick={() => generate()}
        >
          {compose.isPending ? `${AGENT_NAME} está escribiendo…` : "Generar"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
