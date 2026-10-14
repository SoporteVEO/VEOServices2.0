export function TabCount({ value }: { value: number | undefined }) {
  if (value === undefined) return null;
  return (
    <span className="ml-1.5 bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
      {value}
    </span>
  );
}
