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
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { BarChart } from "@/components/ui/bar-chart";

import type { BillboardContractHistoryItem } from "@/api/billboards/billboards.get";
import { getAvailableYears, getYearOccupancy } from "./billboard-detail-utils";

interface BillboardOccupancyChartProps {
  contracts: BillboardContractHistoryItem[];
}

const CHART_CONFIG = {
  occupancyPercent: {
    label: "Ocupación",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

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
        <BarChart
          data={monthData}
          config={CHART_CONFIG}
          xKey="monthLabel"
          series={[{ dataKey: "occupancyPercent" }]}
          yTickFormatter={(value) => `${value}%`}
          tooltipLabelFormatter={(label, payload) => {
            const item = payload[0]?.payload;
            return `${String(label)} ${year}${
              item ? ` · ${item.occupiedDays}/${item.daysInMonth} días` : ""
            }`;
          }}
          className="h-[200px]"
        />
      </CardContent>
    </Card>
  );
}
