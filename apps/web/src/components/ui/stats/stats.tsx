"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type StatItem = {
  label: string;
  value: React.ReactNode;
  description?: string;
};

type StatsProps = {
  items: StatItem[];
  className?: string;
  columnsClassName?: string;
};

export function Stats({ items, className, columnsClassName }: StatsProps) {
  return (
    <div className={cn("w-full", className)}>
      <ul
        className={cn(
          "grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-3",
          columnsClassName,
        )}
      >
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex min-w-0 flex-col gap-1.5 border border-border bg-card px-4 py-3.5"
          >
            <p className="eyebrow truncate">{item.label}</p>
            <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {item.value}
            </p>
            {item.description ? (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
