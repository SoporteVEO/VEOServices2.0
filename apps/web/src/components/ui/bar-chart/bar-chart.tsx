"use client";

import { type ComponentProps, type ReactNode } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
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

export interface BarChartSeries<T> {
  /** Key in the data object for this series. */
  dataKey: Extract<keyof T, string>;
  /** Optional stack id - series sharing the same stackId are stacked. */
  stackId?: string;
  /** Override the corner radius for the rendered bars. */
  radius?: ComponentProps<typeof Bar>["radius"];
}

export interface BarChartProps<T extends object> {
  /** The chart config: keyed by `dataKey`, with `label` and `color`. */
  config: ChartConfig;
  /** Tabular data to render. */
  data: T[];
  /** Field used for the X axis values. */
  xKey: Extract<keyof T, string>;
  /** Series definitions. Each one becomes a `<Bar />` layer. */
  series: BarChartSeries<T>[];
  /** Format function for X axis tick labels. */
  xTickFormatter?: (value: T[keyof T]) => string;
  /** Format function for Y axis tick labels. Set to `null` to hide the Y axis. */
  yTickFormatter?: ((value: number) => string) | null;
  /** Label formatter shown at the top of the tooltip. */
  tooltipLabelFormatter?: (
    label: T[keyof T],
    payload: { payload: T }[],
  ) => string;
  /** Formats numeric series values in the tooltip (defaults to locale string). */
  tooltipValueFormatter?: (value: number, dataKey: string) => ReactNode;
  /** Show the legend below the chart. Defaults to `true` when `series.length > 1`. */
  showLegend?: boolean;
  /** Show the grid lines. Defaults to `true`. */
  showGrid?: boolean;
  /** className applied to the ChartContainer. */
  className?: string;
}

/**
 * Reusable bar chart powered by shadcn `ChartContainer` + Recharts.
 *
 * Colors are pulled from `config[series.dataKey].color` via CSS variables.
 * Bars are animated and rounded by default.
 */
export function BarChart<T extends object>({
  config,
  data,
  xKey,
  series,
  xTickFormatter,
  yTickFormatter,
  tooltipLabelFormatter,
  tooltipValueFormatter,
  showLegend,
  showGrid = true,
  className,
}: BarChartProps<T>) {
  const showLegendResolved = showLegend ?? series.length > 1;

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto h-[260px] w-full", className)}
    >
      <RechartsBarChart
        accessibilityLayer
        data={data}
        margin={{ left: 12, right: 12, top: 8 }}
      >
        {showGrid ? <CartesianGrid vertical={false} /> : null}
        <XAxis
          dataKey={xKey as string}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
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
          cursor={{ fill: "var(--accent)", opacity: 0.4 }}
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
              valueLabelFormatter={tooltipValueFormatter}
            />
          }
        />
        {series.map((s) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey as string}
            stackId={s.stackId}
            fill={`var(--color-${s.dataKey})`}
            radius={s.radius ?? [4, 4, 0, 0]}
            isAnimationActive
            animationDuration={600}
          />
        ))}
        {showLegendResolved ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
      </RechartsBarChart>
    </ChartContainer>
  );
}
