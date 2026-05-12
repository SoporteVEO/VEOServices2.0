"use client";

import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/primitives/ui/chart";
import { cn } from "@/lib/utils";

export interface RadarChartSeries<T> {
  /** Key in the data object for this series. */
  dataKey: Extract<keyof T, string>;
}

export interface RadarChartProps<T extends object> {
  /** Chart config: keyed by `dataKey`, with `label` and `color`. */
  config: ChartConfig;
  /** Tabular data — one entry per axis (e.g. one per KPI). */
  data: T[];
  /** Field used for the polar angle (axis labels). */
  angleKey: Extract<keyof T, string>;
  /** Series definitions. Each one becomes a `<Radar />` polygon. */
  series: RadarChartSeries<T>[];
  /** Show the radius axis ticks (numeric scale). Defaults to `false`. */
  showRadiusAxis?: boolean;
  /** Domain for the radius axis (e.g. `[0, 100]`). */
  radiusAxisDomain?: [number, number];
  /** Fill opacity for the radar polygon. Defaults to `0.5`. */
  fillOpacity?: number;
  /** Outer radius of the polygon (string or number). Defaults to `"70%"`. */
  outerRadius?: string | number;
  /** Hide the tooltip header. */
  hideTooltipLabel?: boolean;
  /** className applied to the ChartContainer. */
  className?: string;
}

/**
 * Reusable radar chart powered by shadcn `ChartContainer` + Recharts.
 *
 * Colors are pulled from `config[series.dataKey].color` via CSS variables.
 */
export function RadarChart<T extends object>({
  config,
  data,
  angleKey,
  series,
  showRadiusAxis = false,
  radiusAxisDomain,
  fillOpacity = 0.5,
  outerRadius = "70%",
  hideTooltipLabel = false,
  className,
}: RadarChartProps<T>) {
  const radiusAxisProps = useMemo(
    () =>
      showRadiusAxis
        ? {
            tickCount: 5,
            domain: radiusAxisDomain,
          }
        : { tick: false, axisLine: false, domain: radiusAxisDomain },
    [showRadiusAxis, radiusAxisDomain],
  );

  return (
    <ChartContainer
      config={config}
      className={cn("mx-auto aspect-square w-full max-w-[420px]", className)}
    >
      <RechartsRadarChart
        data={data}
        outerRadius={outerRadius}
        margin={{ top: 24, right: 56, bottom: 24, left: 56 }}
      >
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel={hideTooltipLabel} />}
        />
        <PolarGrid />
        <PolarAngleAxis
          dataKey={angleKey as string}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <PolarRadiusAxis {...radiusAxisProps} />
        {series.map((s) => (
          <Radar
            key={s.dataKey}
            dataKey={s.dataKey as string}
            stroke={`var(--color-${s.dataKey})`}
            fill={`var(--color-${s.dataKey})`}
            fillOpacity={fillOpacity}
            isAnimationActive
            animationDuration={600}
          />
        ))}
      </RechartsRadarChart>
    </ChartContainer>
  );
}
