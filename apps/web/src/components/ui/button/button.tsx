import * as React from "react";
import {
  Button as PrimitiveButton,
  buttonVariants,
} from "@/components/primitives/ui/button";
import { cn } from "@/lib/utils";

type ButtonSizeVariant = "sm" | "md" | "lg";

const SIZE_VARIANT_CLASS: Record<ButtonSizeVariant, string> = {
  sm: "h-7 px-2.5 text-[0.8rem]",
  md: "h-8 px-3 text-sm",
  lg: "h-9 px-4 text-sm",
};

type ButtonIcon = React.ComponentType<{ className?: string }>;

type ButtonProps = React.ComponentProps<typeof PrimitiveButton> & {
  sizeVariant?: ButtonSizeVariant;
  icon?: ButtonIcon;
  iconPosition?: "left" | "right";
  iconClassName?: string;
};

function Button({
  className,
  sizeVariant = "md",
  icon: Icon,
  iconPosition = "left",
  iconClassName,
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <PrimitiveButton
        asChild
        className={cn(
          "cursor-pointer shadow-sm border-border border",
          SIZE_VARIANT_CLASS[sizeVariant],
          className,
        )}
        {...props}
      >
        {children}
      </PrimitiveButton>
    );
  }

  return (
    <PrimitiveButton
      className={cn(
        `cursor-pointer shadow-sm border-border border`,
        SIZE_VARIANT_CLASS[sizeVariant],
        className,
      )}
      data-icon={
        Icon
          ? iconPosition === "right"
            ? "inline-end"
            : "inline-start"
          : undefined
      }
      asChild={asChild}
      {...props}
    >
      {Icon && iconPosition === "left" ? (
        <Icon className={cn("size-4", iconClassName)} />
      ) : null}
      {children}
      {Icon && iconPosition === "right" ? (
        <Icon className={cn("size-4", iconClassName)} />
      ) : null}
    </PrimitiveButton>
  );
}

export { Button, buttonVariants };
export type { ButtonProps, ButtonSizeVariant };
