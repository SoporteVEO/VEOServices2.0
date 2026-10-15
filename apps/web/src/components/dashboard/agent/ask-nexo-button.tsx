"use client";

import { Sparkles } from "lucide-react";
import { useAgentCapabilities } from "@/api/agent/agent.get";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { Button, type ButtonProps } from "@/components/ui/button";
import { AGENT_NAME } from "@/lib/agent-brand";
import { cn } from "@/lib/utils";
import { useAgentPanel } from "./agent-panel-context";

export const NEXO_ACCENT_CLASS =
  "border-veo-lime/70 bg-veo-lime-soft/40 text-foreground hover:border-veo-lime hover:bg-veo-lime-soft hover:text-foreground dark:bg-veo-lime/10 dark:hover:bg-veo-lime/20";

type AskNexoButtonProps = Omit<ButtonProps, "icon" | "onClick" | "children"> & {
  prompt: string;
  /** `false` prefills the composer so the user completes the request. */
  send?: boolean;
  label?: string;
  hint?: string;
  /** Hides the button when the user lacks this Nexo module. */
  scope?: string;
  iconOnly?: boolean;
  /** Runs before Nexo opens, e.g. to close a drawer that would cover it. */
  onAsk?: () => void;
};

export function AskNexoButton({
  prompt,
  send = true,
  label = `Pregúntale a ${AGENT_NAME}`,
  hint = `Deja que ${AGENT_NAME} haga este trabajo por ti`,
  scope,
  iconOnly = false,
  onAsk,
  variant = "outline",
  className,
  ...props
}: AskNexoButtonProps) {
  const { ask } = useAgentPanel();
  const { data: capabilities } = useAgentCapabilities();

  if (capabilities && !capabilities.enabled) return null;
  if (
    scope &&
    capabilities &&
    !capabilities.scopes.some((item) => item.key === scope)
  ) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          icon={Sparkles}
          iconClassName="text-veo-gray dark:text-veo-lime"
          aria-label={iconOnly ? label : undefined}
          className={cn(
            variant === "outline" && NEXO_ACCENT_CLASS,
            iconOnly && "aspect-square px-0",
            className,
          )}
          onClick={() => {
            onAsk?.();
            ask({ prompt, send });
          }}
          {...props}
        >
          {iconOnly ? null : label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
