"use client";

import { use } from "react";
import { useDigitalBillboardById } from "@/api/digital-billboards/digital-billboards.get";
import { SpotsCalendar } from "@/components/pages/digital-billboards/spots-calendar";
import { Skeleton } from "@/components/primitives/ui/skeleton";

export default function DigitalBillboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: board, isLoading, isError } = useDigitalBillboardById(id);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!board || isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Valla no encontrada</p>
      </div>
    );
  }

  return (
    <section>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">{board.name}</h1>
      </div>
      <SpotsCalendar billboardId={board.id} maxSpots={board.maxSpots} />
    </section>
  );
}
