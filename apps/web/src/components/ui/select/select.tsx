"use client";

import * as React from "react";
import { SelectTrigger as PrimitiveSelectTrigger } from "@/components/primitives/ui/select";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectValue,
  selectTriggerVariants,
} from "@/components/primitives/ui/select";

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
