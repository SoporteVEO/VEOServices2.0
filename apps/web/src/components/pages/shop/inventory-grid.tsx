"use client";

import {
  InventoryCardStatic,
  InventoryCardDigital,
} from "@/components/pages/shop";
import type { DigitalSpotOption } from "@/lib/digital-spots";
import { Frown } from "lucide-react";

interface InventoryGridProps {
  mode: "estatica" | "digital";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  billboards: any[];
  from: string;
  to: string;
  digitalSpots: DigitalSpotOption;
}

export function InventoryGrid({
  mode,
  billboards,
  from,
  to,
  digitalSpots,
}: InventoryGridProps) {
  if (billboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 py-32 text-center mt-8">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted/50 mb-6">
          <Frown className="size-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No hay inventario disponible
        </h3>
        <p className="text-muted-foreground max-w-md">
          Intenta ajustando las fechas de tu campaña o cambiando el municipio
          para encontrar más opciones de vallas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
      {mode === "estatica"
        ? billboards.map((b) => (
            <InventoryCardStatic
              key={b.billboardId}
              billboard={b}
              from={from}
              to={to}
            />
          ))
        : billboards.map((b) => (
            <InventoryCardDigital
              key={b.id}
              billboard={b}
              from={from}
              to={to}
              spotCount={digitalSpots}
            />
          ))}
    </div>
  );
}
