import * as React from "react";
import {
  Button as PrimitiveButton,
  buttonVariants,
} from "@/components/primitives/ui/button";
import { cn } from "@/lib/utils";

type ButtonSizeVariant = "sm" | "md" | "lg";

const SIZE_VARIANT_CLASS: Record<ButtonSizeVariant, string> = {
  sm: "h-8 px-2.5 text-[0.8125rem]",
  md: "h-9 px-3 text-sm",
  lg: "h-11 px-4 text-[0.9375rem]",
};

type ButtonIcon = React.ComponentType<{ className?: string }>;

type ButtonProps = React.ComponentProps<typeof PrimitiveButton> & {
  sizeVariant?: ButtonSizeVariant;
  icon?: ButtonIcon;
  iconPosition?: "left" | "right";
  iconClassName?: string;
  loading?: boolean;
};

function PendingBar() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left animate-pending-fill bg-veo-lime"
    />
  );
}

function Button({
  className,
  sizeVariant = "md",
  icon: Icon,
  iconPosition = "left",
  iconClassName,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <PrimitiveButton
        asChild
        className={cn("cursor-pointer", SIZE_VARIANT_CLASS[sizeVariant], className)}
        {...props}
      >
        {children}
      </PrimitiveButton>
    );
  }

  return (
    <PrimitiveButton
      className={cn(
        "cursor-pointer",
        SIZE_VARIANT_CLASS[sizeVariant],
        loading && "disabled:opacity-80",
        className,
      )}
      data-icon={
        Icon
          ? iconPosition === "right"
            ? "inline-end"
            : "inline-start"
          : undefined
      }
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {Icon && iconPosition === "left" ? (
        <Icon className={cn("size-4", iconClassName)} />
      ) : null}
      {children}
      {Icon && iconPosition === "right" ? (
        <Icon className={cn("size-4", iconClassName)} />
      ) : null}
      {loading ? <PendingBar /> : null}
    </PrimitiveButton>
  );
}

export { Button, PendingBar, buttonVariants };
export type { ButtonProps, ButtonSizeVariant };
