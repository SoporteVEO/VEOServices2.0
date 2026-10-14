import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-150 ease-standard outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-veo-gray dark:hover:bg-veo-gray-40 aria-expanded:bg-veo-gray",
        signal:
          "bg-signal text-signal-foreground hover:bg-veo-dark hover:text-veo-lime dark:hover:bg-veo-lime-deep dark:hover:text-veo-dark",
        outline:
          "border-border-strong/60 bg-card text-foreground hover:border-foreground hover:bg-foreground hover:text-background aria-expanded:border-foreground aria-expanded:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-veo-ice-deep dark:hover:bg-accent aria-expanded:bg-veo-ice-deep",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground shadow-none! border-transparent!",
        destructive:
          "bg-destructive-soft text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive",
        link: "text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground",
        calendarNoEvent:
          "bg-secondary text-secondary-foreground hover:bg-veo-ice-deep",
      },
      size: {
        default:
          "h-9 gap-2 px-3 has-data-[icon=inline-end]:pe-2.5 has-data-[icon=inline-start]:ps-2.5",
        xs: "h-7 gap-1 px-2 text-xs has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 px-2.5 text-[0.8125rem] has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-4 text-[0.9375rem] has-data-[icon=inline-end]:pe-3.5 has-data-[icon=inline-start]:ps-3.5",
        icon: "size-9",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
