"use client";

import { Suspense } from "react";
import { VallasPortal } from "@/components/pages/vallas";
import { Skeleton } from "@/components/primitives/ui/skeleton";

function VallasFallback() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="h-16 w-full border-b bg-background/50 backdrop-blur-md" />

      <div className="border-b bg-card/50 p-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Skeleton className="h-12 w-64 rounded-md" />
          <Skeleton className="h-12 w-56 rounded-md" />
        </div>
      </div>

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

export default function VallasPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Suspense fallback={<VallasFallback />}>
        <VallasPortal />
      </Suspense>
    </div>
  );
}
