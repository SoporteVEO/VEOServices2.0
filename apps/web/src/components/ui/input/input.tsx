import * as React from "react";
import { Search } from "lucide-react";
import { Input as PrimitiveInput } from "@/components/primitives/ui/input";
import { Label } from "@/components/primitives/ui/label";
import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<typeof PrimitiveInput> & {
  isSearch?: boolean;
  label?: React.ReactNode;
  labelClassName?: string;
};

function Input({
  className,
  isSearch = false,
  label,
  labelClassName,
  id,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex w-full flex-col gap-2">
      {label ? (
        <Label
          htmlFor={inputId}
          className={cn(
            "text-xs font-medium text-muted-foreground",
            labelClassName,
          )}
        >
          {label}
        </Label>
      ) : null}
      <div className="relative w-full">
        {isSearch ? (
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50"
          />
        ) : null}
        <PrimitiveInput
          id={inputId}
          className={cn(
            "px-3 py-1.5 bg-accent/50",
            isSearch && "ps-9",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}

export { Input };
