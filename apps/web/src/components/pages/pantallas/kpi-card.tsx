import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  note,
  extra,
  valueClassName,
  onClick,
  title,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  note?: React.ReactNode;
  extra?: React.ReactNode;
  valueClassName?: string;
  onClick?: () => void;
  title?: string;
}) {
  const interactive = Boolean(onClick);
  return (
    <div
      title={title}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "group/kpi relative flex min-w-0 flex-col gap-1.5 border border-border bg-card p-4 transition-colors",
        interactive &&
          "cursor-pointer outline-none hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {interactive ? (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-veo-dark transition-transform duration-300 ease-(--ease-standard) group-hover/kpi:scale-x-100 dark:bg-veo-lime"
        />
      ) : null}
      <div className="eyebrow text-muted-foreground">{label}</div>
      <div
        className={cn(
          "truncate font-heading text-2xl font-semibold leading-tight tabular-nums tracking-tight text-foreground",
          valueClassName,
        )}
      >
        {value}
      </div>
      {note ? <div className="text-xs text-muted-foreground">{note}</div> : null}
      {extra}
    </div>
  );
}
