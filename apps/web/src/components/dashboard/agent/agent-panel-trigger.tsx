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
            "group relative inline-flex h-8 shrink-0 items-center gap-1.5 overflow-hidden rounded-full py-0.5 ps-0.5 pe-1 text-sm font-semibold sm:pe-3.5",
            "bg-gradient-to-r from-primary via-primary to-chart-2 text-primary-foreground",
            "shadow-md shadow-primary/25 ring-1 ring-primary/40 transition-all duration-200",
            "hover:shadow-lg hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open && "ring-2 ring-offset-2 ring-offset-background",
          )}
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative flex size-7 items-center justify-center rounded-full bg-zinc-950 ring-1 ring-black/20">
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
