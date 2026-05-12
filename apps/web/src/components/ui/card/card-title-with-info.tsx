"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { CardTitle } from "@/components/primitives/ui/card";
import { Button } from "@/components/primitives/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { cn } from "@/lib/utils";

export type CardTitleWithInfoProps = {
  children: React.ReactNode;
  info?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  buttonClassName?: string;
  "aria-label"?: string;
};

function CardTitleWithInfo({
  children,
  info,
  className,
  titleClassName,
  buttonClassName,
  "aria-label": ariaLabel,
}: CardTitleWithInfoProps) {
  const showInfo =
    info != null &&
    info !== false &&
    (typeof info !== "string" || info.trim().length > 0);

  const accessibleLabel =
    ariaLabel ??
    (typeof info === "string" || typeof info === "number"
      ? String(info)
      : showInfo
        ? "Información"
        : undefined);

  return (
    <div className={cn("flex w-full min-w-0 items-start gap-2", className)}>
      <CardTitle
        className={cn("min-w-0 flex-1 text-muted-foreground", titleClassName)}
      >
        {children}
      </CardTitle>
      {showInfo ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={accessibleLabel}
              className={cn(
                "mt-0.5 shrink-0 text-muted-foreground hover:text-foreground",
                buttonClassName,
              )}
            >
              <Info className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={6}
            className="max-w-xs text-left font-normal"
          >
            <span className="text-sm leading-snug">{info}</span>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export { CardTitleWithInfo };
