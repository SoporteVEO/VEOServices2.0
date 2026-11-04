"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVAILABLE_COLOR,
  COLOR_MODE_LABELS,
  OCCUPIED_COLOR,
  SCREEN_COLOR,
  SITE_COLOR,
  TIER_META,
  TIER_ORDER,
  type ColorMode,
  type MapLayers,
} from "../expansion-const";

const TIER_RANGES: Record<ColorMode, string[]> = {
  profitability: ["ROI ≥ 2.5x", "ROI ≥ 1.5x", "ROI ≥ 1x", "ROI < 1x"],
  occupancy: ["≥ 75%", "≥ 50%", "≥ 25%", "< 25%"],
  status: [],
};

function Swatch({ color, label, hint }: { color: string; label: string; hint?: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
      <span className="flex-1">{label}</span>
      {hint ? <span className="text-muted-foreground tabular-nums">{hint}</span> : null}
    </li>
  );
}

function Gradient({ label, colors }: { label: string; colors: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <span>{label}</span>
      <div
        className="h-1.5 rounded-full"
        style={{ backgroundImage: `linear-gradient(to right, ${colors.join(",")})` }}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Bajo</span>
        <span>Alto</span>
      </div>
    </div>
  );
}

export function ExpansionMapLegend({
  colorMode,
  layers,
  occupancyBasedCount,
}: {
  colorMode: ColorMode;
  layers: MapLayers;
  occupancyBasedCount: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-10 w-56 rounded-lg border bg-background/95 text-xs shadow-md backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between px-3 py-2 font-semibold"
      >
        {COLOR_MODE_LABELS[colorMode]}
        <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t px-3 py-2">
          <ul className="flex flex-col gap-1.5">
            {colorMode === "status" ? (
              <>
                <Swatch color={OCCUPIED_COLOR} label="Contratada hoy" />
                <Swatch color={AVAILABLE_COLOR} label="Disponible hoy" />
              </>
            ) : (
              TIER_ORDER.map((tier, index) => (
                <Swatch
                  key={tier}
                  color={TIER_META[tier].color}
                  label={TIER_META[tier].label}
                  hint={TIER_RANGES[colorMode][index]}
                />
              ))
            )}
            {layers.sites ? <Swatch color={SITE_COLOR} label="Ubicación planificada" /> : null}
            {layers.screens ? <Swatch color={SCREEN_COLOR} label="Pantalla digital" /> : null}
          </ul>

          {layers.profitHeat ? (
            <Gradient
              label="Calor de rentabilidad"
              colors={["#fef08a", "#facc15", "#84cc16", "#16a34a", "#14532d"]}
            />
          ) : null}
          {layers.densityHeat ? (
            <Gradient
              label="Densidad de vallas"
              colors={["#bfdbfe", "#60a5fa", "#a855f7", "#ec4899", "#be123c"]}
            />
          ) : null}

          {colorMode === "profitability" && occupancyBasedCount > 0 ? (
            <p className="flex gap-1.5 text-[11px] text-muted-foreground">
              <Info className="mt-px size-3 shrink-0" />
              {occupancyBasedCount} vallas sin costo mensual se califican por ocupación.
            </p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            Clic derecho en el mapa para planificar una ubicación.
          </p>
        </div>
      ) : null}
    </div>
  );
}
