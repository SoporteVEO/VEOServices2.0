import * as React from "react";

import { cn } from "@/lib/utils";

export type FormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-card p-5",
        className,
      )}
    >
      <header className="mb-4 border-b border-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground before:size-1.5 before:shrink-0 before:bg-veo-gray dark:before:bg-veo-lime">
          {title}
        </h3>
        {description ? (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
