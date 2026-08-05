"use client";

import { Frown } from "lucide-react";
import { VallasCard } from "./vallas-card";
import type { AvailableBillboard } from "@/api/billboards/billboards.types";

interface VallasGridProps {
  billboards: AvailableBillboard[];
}

export function VallasGrid({ billboards }: VallasGridProps) {
  if (billboards.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 py-32 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted/50">
          <Frown className="size-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          No hay vallas disponibles
        </h3>
        <p className="max-w-md text-muted-foreground">
          Intenta ajustando las fechas o seleccionando otro municipio para
          encontrar más opciones.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {billboards.map((b) => (
        <VallasCard key={b.billboardId} billboard={b} />
      ))}
    </div>
  );
}
