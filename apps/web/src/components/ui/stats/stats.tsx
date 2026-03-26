"use client";

import * as React from "react";
import {
  Card,
  CardContent,
} from "@/components/primitives/ui/card";
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
          "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
          columnsClassName,
        )}
      >
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            <Card
              size="sm"
              className="border border-border/80 bg-accent/20 py-3 shadow-none ring-0"
            >
              <CardContent className="flex flex-col gap-1 px-4 py-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground">
                  {item.value}
                </p>
                {item.description ? (
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
