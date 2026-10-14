import { Skeleton } from "@/components/primitives/ui/skeleton";
import { cn } from "@/lib/utils";

type ListSkeletonProps = {
  rows?: number;
  variant?: "row" | "card";
  className?: string;
};

export function ListSkeleton({
  rows = 4,
  variant = "row",
  className,
}: ListSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn("flex flex-col gap-2", className)}
    >
      {Array.from({ length: rows }).map((_, i) =>
        variant === "card" ? (
          <div
            key={i}
            className="flex flex-col gap-3 border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5.5 w-20" />
            </div>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ) : (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <Skeleton className="size-8 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}
