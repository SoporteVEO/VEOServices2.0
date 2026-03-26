"use client";

import { Suspense } from "react";
import { ShopSection } from "@/components/pages/shop";
import { Skeleton } from "@/components/primitives/ui/skeleton";

function ShopFallback() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="h-16 w-full border-b bg-background/50 backdrop-blur-md" />

      {/* Filter bar skeleton */}
      <div className="border-b bg-card/50 p-4">
        <div className="mx-auto max-w-7xl flex items-center gap-4">
          <Skeleton className="h-12 w-48 rounded-md" />
          <Skeleton className="h-12 w-64 rounded-md" />
          <Skeleton className="h-12 w-48 rounded-md" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="mx-auto w-full max-w-7xl p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="w-full flex-1 flex flex-col">
      <Suspense fallback={<ShopFallback />}>
        <ShopSection />
      </Suspense>
    </div>
  );
}
