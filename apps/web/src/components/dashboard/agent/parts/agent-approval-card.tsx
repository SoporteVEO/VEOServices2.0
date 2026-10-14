"use client";

import type { ReactNode } from "react";
import { Check, CircleCheck, CircleX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentChatActions } from "../agent-chat-context";
import { AgentPartFrame } from "./agent-part-frame";

interface AgentApprovalCardProps {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  state: string;
  approvalId?: string;
  approveLabel: string;
  children: ReactNode;
  result?: ReactNode;
}

export function AgentApprovalCard({
  title,
  description,
  icon,
  state,
  approvalId,
  approveLabel,
  children,
  result,
}: AgentApprovalCardProps) {
  const { respondToApproval, isBusy } = useAgentChatActions();

  function footer() {
    if (state === "approval-requested" && approvalId) {
      return (
        <div className="flex justify-end gap-2 border-t px-3 py-2">
          <Button
            variant="outline"
            sizeVariant="sm"
            icon={X}
            disabled={isBusy}
            onClick={() => respondToApproval(approvalId, false)}
          >
            Cancelar
          </Button>
          <Button
            sizeVariant="sm"
            icon={Check}
            disabled={isBusy}
            onClick={() => respondToApproval(approvalId, true)}
          >
            {approveLabel}
          </Button>
        </div>
      );
    }
    if (state === "approval-responded" || state === "input-available") {
      return (
        <p className="flex items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
          <span className="size-2 shrink-0 bg-veo-gray animate-square-blink" aria-hidden /> Ejecutando…
        </p>
      );
    }
    if (state === "output-denied") {
      return (
        <p className="flex items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
          <CircleX className="size-3.5" /> Cancelado por el usuario
        </p>
      );
    }
    if (state === "output-error") {
      return (
        <p className="flex items-center gap-2 border-t px-3 py-2 text-xs text-destructive">
          <CircleX className="size-3.5" /> No se pudo completar la acción
        </p>
      );
    }
    if (state === "output-available") {
      return (
        <div className="flex items-start gap-2 border-t px-3 py-2 text-xs">
          <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">{result}</div>
        </div>
      );
    }
    return null;
  }

  return (
    <AgentPartFrame icon={icon} title={title} description={description}>
      <div className="max-h-72 overflow-auto px-3 py-2.5 text-sm">
        {children}
      </div>
      {footer()}
    </AgentPartFrame>
  );
}
