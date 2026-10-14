import { Skeleton } from "@/components/primitives/ui/skeleton";
import { cn } from "@/lib/utils";

type DetailPanelSkeletonProps = {
  sections?: number;
  withFooter?: boolean;
  className?: string;
};

export function DetailPanelSkeleton({
  sections = 2,
  withFooter = true,
  className,
}: DetailPanelSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn("flex min-h-0 flex-1 flex-col", className)}
    >
      <div className="flex flex-col gap-2.5 border-b border-border bg-card px-5 py-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-2/3 max-w-xs" />
        <div className="flex gap-2">
          <Skeleton className="h-5.5 w-20" />
          <Skeleton className="h-5.5 w-24" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-5">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 border border-border p-3">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
        {Array.from({ length: sections }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="h-3.5 w-32" />
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-x-6 gap-y-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-4 w-full max-w-[14rem]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {withFooter ? (
        <div className="flex justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      ) : null}
    </div>
  );
}
