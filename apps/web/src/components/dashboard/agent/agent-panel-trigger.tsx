"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { AGENT_NAME } from "@/lib/agent-brand";
import { cn } from "@/lib/utils";
import { useAgentPanel } from "./agent-panel-context";
import { NexoAvatar } from "./nexo-avatar";

export function AgentPanelTrigger() {
  const { open, toggle } = useAgentPanel();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={open}
          aria-label={open ? `Cerrar ${AGENT_NAME}` : `Abrir ${AGENT_NAME}`}
          className={cn(
            "group relative inline-flex h-9 shrink-0 items-center gap-2 overflow-hidden ps-1 pe-1 text-sm font-semibold sm:pe-3",
            "transition-colors duration-150 ease-standard",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            open
              ? "bg-veo-lime text-veo-dark hover:bg-veo-lime-deep"
              : "bg-veo-dark text-white hover:bg-veo-gray dark:bg-veo-ice dark:text-veo-dark dark:hover:bg-veo-gray-40",
          )}
        >
          <span className="relative flex size-7 items-center justify-center bg-veo-dark-90">
            <NexoAvatar
              size={26}
              priority
              className={cn(
                "origin-bottom",
                open ? "rotate-6" : "group-hover:animate-nexo-wave",
              )}
            />
          </span>
          <span className="hidden whitespace-nowrap sm:inline">
            {AGENT_NAME}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {open ? `Cerrar ${AGENT_NAME}` : `Abrir ${AGENT_NAME}`} · Ctrl + I
      </TooltipContent>
    </Tooltip>
  );
}
