"use client";

import * as React from "react";
import {
  Select as SelectRoot,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger as PrimitiveSelectTrigger,
  SelectValue,
  selectTriggerVariants,
} from "@/components/primitives/ui/select";
import { cn } from "@/lib/utils";

export {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectValue,
  selectTriggerVariants,
};

export type SelectRootProps = React.ComponentProps<typeof SelectRoot>;

export type SelectProps = SelectRootProps & {
  label?: string;
  /** Applied to the outer wrapper (label + control), matching Combobox `className`. */
  className?: string;
};

function Select({
  label,
  required,
  className,
  children,
  ...rootProps
}: SelectProps) {
  return (
    <div
      className={cn("flex flex-col", label ? "gap-2" : "gap-0", className)}
    >
      {label ? (
        <p className="text-sm font-medium text-muted-foreground">
          {label}
          {required ? <span className="text-red-500 ml-1">*</span> : null}
        </p>
      ) : null}
      <SelectRoot required={required} {...rootProps}>
        {children}
      </SelectRoot>
    </div>
  );
}

export { Select };

type SelectSizeVariant = "sm" | "md" | "lg";

const SIZE_TO_PRIMITIVE: Record<
  SelectSizeVariant,
  "sm" | "default" | "lg"
> = {
  sm: "sm",
  md: "default",
  lg: "lg",
};

type SelectTriggerProps = Omit<
  React.ComponentProps<typeof PrimitiveSelectTrigger>,
  "size"
> & {
  sizeVariant?: SelectSizeVariant;
};

function SelectTrigger({ sizeVariant = "lg", ...props }: SelectTriggerProps) {
  return (
    <PrimitiveSelectTrigger
      size={SIZE_TO_PRIMITIVE[sizeVariant]}
      {...props}
    />
  );
}

export { SelectTrigger };
export type { SelectSizeVariant, SelectTriggerProps };
