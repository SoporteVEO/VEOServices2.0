import { cn } from "@/lib/utils";

export function toPrettyJson(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2) ?? String(value);
}

export function CodeBlock({
  label,
  value,
  className,
}: {
  label?: string;
  value: unknown;
  className?: string;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label ? (
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      ) : null}
      <pre
        className={cn(
          "max-h-80 overflow-auto rounded-md border bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all",
          className,
        )}
      >
        {toPrettyJson(value)}
      </pre>
    </div>
  );
}
