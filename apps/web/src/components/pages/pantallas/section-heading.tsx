export function SectionHeading({
  title,
  hint,
}: {
  title: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="shrink-0 text-sm font-semibold">{title}</h2>
      <div className="h-px flex-1 bg-border" />
      {hint ? <span className="shrink-0 text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
