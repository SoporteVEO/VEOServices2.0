"use client";

import { useMemo, type ReactNode } from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/primitives/ui/chart";
import { cn } from "@/lib/utils";

export interface DonutChartSlice {
  /** Unique key matching the corresponding entry in `config`. */
  key: string;
  /** Numeric value for this slice. */
  value: number;
}

export interface DonutChartProps {
  /** Chart config — keys must match `slices[i].key`. */
  config: ChartConfig;
  /** The slices to render. Each one becomes a wedge. */
  slices: DonutChartSlice[];
  /** Inner radius for the donut hole, defaults to `60`. */
  innerRadius?: number;
  /** Outer radius for the donut, defaults to letting recharts fit it. */
  outerRadius?: number;
  /** The big number drawn in the center hole. */
  centerValue?: ReactNode;
  /** Sub-label shown under `centerValue`. */
  centerLabel?: ReactNode;
  /** Hide the tooltip header. */
  hideTooltipLabel?: boolean;
  /** className applied to the ChartContainer. */
  className?: string;
}

/**
 * Reusable donut chart powered by shadcn `ChartContainer` + Recharts.
 *
 * Each `slice.key` must match a `config[key].color` so colors come from the
 * theme palette via CSS variables.
 */
export function DonutChart({
  config,
  slices,
  innerRadius = 60,
  outerRadius,
  centerValue,
  centerLabel,
  hideTooltipLabel = true,
  className,
}: DonutChartProps) {
  const data = useMemo(
    () =>
      slices.map((s) => ({
        key: s.key,
        value: s.value,
        fill: `var(--color-${s.key})`,
      })),
    [slices],
  );

  return (
    <ChartContainer
      config={config}
      className={cn(
        "mx-auto aspect-square h-[220px] [&_.recharts-pie-label-text]:fill-foreground",
        className,
      )}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel={hideTooltipLabel} />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          stroke="var(--background)"
          strokeWidth={3}
          isAnimationActive
          animationDuration={600}
        >
          {centerValue != null || centerLabel != null ? (
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                  return null;
                }
                const cx = viewBox.cx ?? 0;
                const cy = viewBox.cy ?? 0;
                return (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {centerValue != null ? (
                      <tspan
                        x={cx}
                        y={cy}
                        className="fill-foreground text-2xl font-semibold tabular-nums"
                      >
                        {centerValue}
                      </tspan>
                    ) : null}
                    {centerLabel != null ? (
                      <tspan
                        x={cx}
                        y={cy + 22}
                        className="fill-muted-foreground text-[11px] uppercase tracking-wider"
                      >
                        {centerLabel}
                      </tspan>
                    ) : null}
                  </text>
                );
              }}
            />
          ) : null}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
