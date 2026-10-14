import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AgentPartFrameProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function AgentPartFrame({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
}: AgentPartFrameProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2">
          {Icon ? (
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {title}
            </p>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 gap-1.5">{actions}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
