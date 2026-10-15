import { cn } from "@/lib/utils";

export function CrmDealMetric({
  label,
  value,
  hint,
  warn = false,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border border-border bg-card p-3">
      <span className="eyebrow truncate text-muted-foreground">{label}</span>
      <span className="truncate text-base font-semibold tabular-nums">{value}</span>
      {hint ? (
        <span
          className={cn(
            "truncate text-[11px]",
            warn ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}
