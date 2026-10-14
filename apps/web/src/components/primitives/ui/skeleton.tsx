import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-veo-gray-20/70 dark:bg-veo-dark-80",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
