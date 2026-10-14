import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/primitives/ui/skeleton";
import { NativeCounterUp } from "@/components/ui/counter-up";
import { cn } from "@/lib/utils";

export type KpiTone =
  | "primary"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "neutral";

export interface KpiItem {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  detail?: string;
  tone?: KpiTone;
}

const TONE_ICON: Record<KpiTone, string> = {
  primary: "bg-veo-ice text-veo-dark dark:bg-veo-dark-80 dark:text-veo-ice",
  emerald: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  rose: "bg-destructive-soft text-destructive",
  sky: "bg-info-soft text-info",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  neutral: "bg-muted text-muted-foreground",
};

const TONE_MARKER: Record<KpiTone, string> = {
  primary: "bg-veo-dark dark:bg-veo-ice",
  emerald: "bg-success",
  amber: "bg-warning",
  rose: "bg-destructive",
  sky: "bg-info",
  violet: "bg-violet-600 dark:bg-violet-400",
  neutral: "bg-border-strong",
};

const GRID_CLASS =
  "grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,13.5rem),1fr))]";

export function KpiGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(GRID_CLASS, className)}>{children}</div>;
}

export function KpiGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-label="Cargando indicadores" className={cn(GRID_CLASS, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex h-[104px] flex-col justify-between border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="size-7" />
          </div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      ))}
    </div>
  );
}

export function KpiTile({ item }: { item: KpiItem }) {
  const tone = item.tone ?? "primary";
  return (
    <div className="group/kpi relative flex min-w-0 flex-col gap-2 border border-border bg-card p-4 transition-colors hover:border-border-strong">
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-(--ease-standard) group-hover/kpi:scale-x-100",
          TONE_MARKER[tone],
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <span className="eyebrow min-w-0 truncate text-muted-foreground">
          {item.label}
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center",
            TONE_ICON[tone],
          )}
        >
          <item.icon className="size-3.5" />
        </span>
      </div>
      <NativeCounterUp
        value={item.value}
        prefix={item.prefix}
        suffix={item.suffix}
        decimals={item.decimals ?? 0}
        label={item.label}
        duration={1.4}
        className="truncate font-heading text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground"
      />
      {item.detail ? (
        <span className="truncate text-xs text-muted-foreground">
          {item.detail}
        </span>
      ) : null}
    </div>
  );
}
