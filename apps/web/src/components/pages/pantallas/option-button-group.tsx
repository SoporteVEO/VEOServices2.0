import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OptionButtonGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
  disabled,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T | null;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? <p className="text-xs font-medium text-muted-foreground">{label}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            key={String(option.value)}
            type="button"
            sizeVariant="sm"
            disabled={disabled}
            variant={option.value === value ? "default" : "outline"}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
