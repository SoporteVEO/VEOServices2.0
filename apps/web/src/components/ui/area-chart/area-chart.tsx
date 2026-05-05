"use client";

import { useId, type ComponentProps } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/primitives/ui/chart";
import { cn } from "@/lib/utils";

export interface AreaChartSeries<T> {
  /** Key in the data object for this series. */
  dataKey: Extract<keyof T, string>;
  /** Optional stack id - series sharing the same stackId are stacked. */
  stackId?: string;
  /** Curve type, defaults to `monotone` for smoother visuals. */
  type?: ComponentProps<typeof Area>["type"];
  /** Override fill opacity. */
  fillOpacity?: number;
}

export interface AreaChartProps<T extends object> {
  /** The chart config: keyed by `dataKey`, with `label` and `color`. */
  config: ChartConfig;
  /** Tabular data to render. */
  data: T[];
  /** Field used for the X axis values. */
  xKey: Extract<keyof T, string>;
  /** Series definitions. Each one becomes an `<Area />` layer. */
  series: AreaChartSeries<T>[];
  /** Format function for X axis tick labels. */
  xTickFormatter?: (value: T[keyof T]) => string;
  /** Format function for Y axis tick labels. Set to `null` to hide the Y axis. */
  yTickFormatter?: ((value: number) => string) | null;
  /** Label formatter shown at the top of the tooltip. */
  tooltipLabelFormatter?: (
    label: T[keyof T],
    payload: { payload: T }[],
  ) => string;
  /** Show the legend below the chart. Defaults to `true` when `series.length > 1`. */
  showLegend?: boolean;
  /** Show the grid lines. Defaults to `true`. */
  showGrid?: boolean;
  /** className applied to the ChartContainer. */
  className?: string;
}

/**
 * Reusable area chart powered by shadcn `ChartContainer` + Recharts.
 *
 * Each series is rendered with a vertical gradient fill that uses the color
 * configured in `config[series.dataKey].color`.
 */
export function AreaChart<T extends object>({
  config,
  data,
  xKey,
  series,
  xTickFormatter,
  yTickFormatter,
  tooltipLabelFormatter,
  showLegend,
  showGrid = true,
  className,
}: AreaChartProps<T>) {
  const uid = useId().replace(/:/g, "");
  const showLegendResolved = showLegend ?? series.length > 1;

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto h-[260px] w-full", className)}
    >
      <RechartsAreaChart
        accessibilityLayer
        data={data}
        margin={{ left: 12, right: 12, top: 8 }}
      >
        <defs>
          {series.map((s) => {
            const gradientId = `area-fill-${uid}-${s.dataKey}`;
            return (
              <linearGradient
                key={s.dataKey}
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={`var(--color-${s.dataKey})`}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-${s.dataKey})`}
                  stopOpacity={0.1}
                />
              </linearGradient>
            );
          })}
        </defs>
        {showGrid ? <CartesianGrid vertical={false} /> : null}
        <XAxis
          dataKey={xKey as string}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={
            xTickFormatter
              ? (value: T[keyof T]) => xTickFormatter(value)
              : undefined
          }
        />
        {yTickFormatter !== null ? (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={48}
            tickFormatter={yTickFormatter}
          />
        ) : null}
        <ChartTooltip
          cursor={{
            stroke: "var(--border)",
            strokeWidth: 1,
            strokeDasharray: "3 3",
          }}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={
                tooltipLabelFormatter
                  ? (label, payload) =>
                      tooltipLabelFormatter(
                        label as T[keyof T],
                        payload as unknown as { payload: T }[],
                      )
                  : undefined
              }
            />
          }
        />
        {series.map((s) => {
          const gradientId = `area-fill-${uid}-${s.dataKey}`;
          return (
            <Area
              key={s.dataKey}
              dataKey={s.dataKey as string}
              type={s.type ?? "monotone"}
              stackId={s.stackId}
              stroke={`var(--color-${s.dataKey})`}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              fillOpacity={s.fillOpacity ?? 0.4}
              isAnimationActive
              animationDuration={600}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                fill: "var(--background)",
                stroke: `var(--color-${s.dataKey})`,
              }}
            />
          );
        })}
        {showLegendResolved ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
      </RechartsAreaChart>
    </ChartContainer>
  );
}
