"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AgentIconButtonProps = Omit<ButtonProps, "icon" | "children"> & {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  side?: "top" | "bottom" | "left" | "right";
};

export function AgentIconButton({
  label,
  icon,
  loading = false,
  side = "top",
  className,
  iconClassName,
  disabled,
  ...props
}: AgentIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            variant="ghost"
            sizeVariant="sm"
            icon={icon}
            loading={loading}
            iconClassName={iconClassName}
            className={cn("size-8 border-0 p-0 shadow-none", className)}
            disabled={disabled || loading}
            aria-label={label}
            {...props}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
