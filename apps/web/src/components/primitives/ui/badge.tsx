import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-4xl border border-transparent px-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-veo-gray",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-veo-ice-deep",
        destructive:
          "bg-destructive-soft text-destructive [a]:hover:bg-destructive [a]:hover:text-destructive-foreground",
        success:
          "bg-success-soft text-success before:size-1.5 before:shrink-0 before:bg-current",
        warning:
          "bg-warning-soft text-warning before:size-1.5 before:shrink-0 before:bg-current",
        info: "bg-info-soft text-info before:size-1.5 before:shrink-0 before:bg-current",
        signal: "bg-signal text-signal-foreground",
        outline:
          "border-border-strong/50 bg-card text-foreground [a]:hover:border-foreground",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
