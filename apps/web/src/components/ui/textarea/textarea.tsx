import * as React from "react";
import { Textarea as PrimitiveTextarea } from "@/components/primitives/ui/textarea";
import { Label } from "@/components/primitives/ui/label";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<typeof PrimitiveTextarea> & {
  label?: React.ReactNode;
  labelClassName?: string;
};

function Textarea({
  className = "shadow-sm",
  label,
  labelClassName,
  id,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const textareaId = id ?? generatedId;

  return (
    <div className="flex w-full flex-col gap-2">
      {label ? (
        <Label
          htmlFor={textareaId}
          className={cn(
            "text-xs font-medium text-muted-foreground",
            labelClassName,
          )}
        >
          {label}
        </Label>
      ) : null}
      <PrimitiveTextarea
        id={textareaId}
        className={cn("px-3 py-1.5 bg-input", className)}
        {...props}
      />
    </div>
  );
}

export { Textarea };
