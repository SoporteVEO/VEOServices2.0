import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Separator } from "@/components/primitives/ui/separator";

export function MyOfferDetailSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-56" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="size-8 shrink-0 rounded-md" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-4">
        <SectionSkeleton fieldCount={6} columns={2} />

        <Separator />

        <div className="space-y-3">
          <SectionTitleSkeleton />
          <Skeleton className="h-44 w-full rounded-lg" />
        </div>

        <Separator />

        <div className="space-y-3">
          <SectionTitleSkeleton />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>

        <Separator />

        <SectionSkeleton fieldCount={2} columns={1} />
      </div>

      <div className="flex items-center justify-between gap-2 border-t p-4">
        <Skeleton className="h-9 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </>
  );
}

function SectionTitleSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="size-6 shrink-0 rounded-md" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

function SectionSkeleton({
  fieldCount,
  columns,
}: {
  fieldCount: number;
  columns: 1 | 2;
}) {
  return (
    <div className="space-y-3">
      <SectionTitleSkeleton />
      <div
        className={
          columns === 2
            ? "grid grid-cols-1 gap-3 pl-8 sm:grid-cols-2"
            : "flex flex-col gap-3 pl-8"
        }
      >
        {Array.from({ length: fieldCount }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full max-w-[220px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
