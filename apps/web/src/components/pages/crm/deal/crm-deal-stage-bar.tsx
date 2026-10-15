"use client";

import { Check } from "lucide-react";
import type { CrmDealDetail, CrmStage } from "@/api/crm/crm.types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  deal: CrmDealDetail;
  stages: CrmStage[];
  disabled?: boolean;
  onMove: (stageId: string) => void;
}

/** Clickable stage progression; closed deals show it read-only. */
export function CrmDealStageBar({ deal, stages, disabled = false, onMove }: Props) {
  const openStages = stages.filter((stage) => stage.kind === "OPEN");
  const currentIndex = openStages.findIndex((stage) => stage.id === deal.stage.id);
  const closed = deal.status !== "OPEN";

  return (
    <div className="flex w-full gap-1">
      {openStages.map((stage, index) => {
        const reached = closed
          ? deal.status === "WON"
          : currentIndex >= 0 && index <= currentIndex;
        const current = stage.id === deal.stage.id;
        return (
          <Tooltip key={stage.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={disabled || closed || current}
                onClick={() => onMove(stage.id)}
                className={cn(
                  "group flex h-7 min-w-0 flex-1 items-center justify-center gap-1 px-2 text-[11px] font-medium transition-colors first:rounded-l-md last:rounded-r-md",
                  reached
                    ? "bg-veo-dark text-white dark:bg-veo-lime dark:text-veo-dark"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  !closed && !current && !disabled && "cursor-pointer",
                  current && "ring-2 ring-veo-lime ring-offset-1 ring-offset-background",
                )}
              >
                {reached && !current ? <Check className="size-3 shrink-0" /> : null}
                <span className="truncate">{stage.name}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {stage.name} · {stage.probability}%
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
