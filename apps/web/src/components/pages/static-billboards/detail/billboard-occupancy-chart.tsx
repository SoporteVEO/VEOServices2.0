"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Button } from "@/components/primitives/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { cn } from "@/lib/utils";
import type { BillboardContractHistoryItem } from "@/api/billboards/billboards.get";
import { getAvailableYears, getYearOccupancy } from "./billboard-detail-utils";

interface BillboardOccupancyChartProps {
  contracts: BillboardContractHistoryItem[];
}

export function BillboardOccupancyChart({
  contracts,
}: BillboardOccupancyChartProps) {
  const availableYears = useMemo(
    () => getAvailableYears(contracts),
    [contracts],
  );
  const [year, setYear] = useState<number>(() => new Date().getFullYear());

  const monthData = useMemo(
    () => getYearOccupancy(contracts, year),
    [contracts, year],
  );

  const totalOccupiedDays = monthData.reduce(
    (sum, m) => sum + m.occupiedDays,
    0,
  );
  const totalDaysInYear = monthData.reduce((sum, m) => sum + m.daysInMonth, 0);
  const yearOccupancyPercent =
    totalDaysInYear > 0
      ? Math.round((totalOccupiedDays / totalDaysInYear) * 100)
      : 0;

  const occupiedMonths = monthData.filter((m) => m.occupiedDays > 0).length;
  const fullyOccupiedMonths = monthData.filter(
    (m) => m.occupancyPercent === 100,
  ).length;

  const yearIndex = availableYears.indexOf(year);
  const canGoPrev = yearIndex < availableYears.length - 1;
  const canGoNext = yearIndex > 0;

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Ocupación anual</CardTitle>
            <CardDescription className="text-xs">
              {occupiedMonths} {occupiedMonths === 1 ? "mes" : "meses"} con
              contrato · {fullyOccupiedMonths} mes(es) completos ·{" "}
              {yearOccupancyPercent}% del año ocupado
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canGoPrev}
              onClick={() => {
                const next = availableYears[yearIndex + 1];
                if (next != null) setYear(next);
              }}
              aria-label="Año anterior"
            >
              <ChevronLeft />
            </Button>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger size="sm" className="w-[88px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canGoNext}
              onClick={() => {
                const next = availableYears[yearIndex - 1];
                if (next != null) setYear(next);
              }}
              aria-label="Año siguiente"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-stretch gap-1.5">
          {monthData.map((m) => {
            const percent = m.occupancyPercent;
            const heightPct = Math.max(percent, percent > 0 ? 4 : 0);
            return (
              <Tooltip key={m.monthIndex}>
                <TooltipTrigger asChild>
                  <div className="flex h-full flex-1 flex-col items-center gap-1.5">
                    <div className="relative w-full flex-1 overflow-hidden rounded-md bg-accent/40">
                      <div
                        className={cn(
                          "absolute inset-x-0 bottom-0 rounded-md transition-all",
                          percent === 0 && "bg-transparent",
                          percent > 0 && percent < 50 && "bg-amber-400/70",
                          percent >= 50 && percent < 100 && "bg-amber-500",
                          percent === 100 && "bg-rose-500",
                        )}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {m.monthLabel}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {m.monthLabel} {year}
                    </span>
                    <span className="text-[11px] opacity-90">
                      {m.occupiedDays}/{m.daysInMonth} días ocupados (
                      {m.occupancyPercent}%)
                    </span>
                    {m.contractsCount > 0 && (
                      <span className="text-[11px] opacity-90">
                        {m.contractsCount} contrato
                        {m.contractsCount === 1 ? "" : "s"} activo
                        {m.contractsCount === 1 ? "" : "s"}
                      </span>
                    )}
                    {m.occupiedDays === 0 && (
                      <span className="text-[11px] opacity-90">
                        Disponible todo el mes
                      </span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <LegendItem className="bg-accent/40" label="Disponible" />
          <LegendItem className="bg-amber-400/70" label="Parcial (<50%)" />
          <LegendItem className="bg-amber-500" label="Ocupado (50–99%)" />
          <LegendItem className="bg-rose-500" label="Lleno (100%)" />
        </div>
      </CardContent>
    </Card>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}
