import { Card, CardContent } from "@/components/primitives/ui/card";
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
  return (
    <Card
      size="sm"
      title={title}
      onClick={onClick}
      className={cn(
        "border border-border/80 bg-accent/20 py-3 shadow-none ring-0",
        onClick && "cursor-pointer transition-colors hover:bg-accent/40",
      )}
    >
      <CardContent className="flex min-w-0 flex-col gap-1 px-4 py-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div
          className={cn(
            "truncate text-xl font-semibold tabular-nums tracking-tight text-foreground",
            valueClassName,
          )}
        >
          {value}
        </div>
        {note ? <div className="text-xs text-muted-foreground">{note}</div> : null}
        {extra}
      </CardContent>
    </Card>
  );
}
