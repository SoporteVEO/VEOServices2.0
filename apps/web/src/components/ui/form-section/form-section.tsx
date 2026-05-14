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
        "rounded-md border border-border/80 bg-muted/15 p-4",
        className,
      )}
    >
      <header className="mb-4 pb-3">
        <h3 className="text-base font-medium tracking-tight text-muted-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
