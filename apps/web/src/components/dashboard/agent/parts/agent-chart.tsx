"use client";

import { ChartColumn } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { AgentChartInput } from "@/api/agent/agent.types";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/primitives/ui/chart";
import { AreaChart } from "@/components/ui/area-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { formatAgentValue, toNumber } from "@/lib/agent-format";
import { AgentPartFrame } from "./agent-part-frame";

const PALETTE_SIZE = 5;

type ChartRow = Record<string, string | number>;

function color(index: number) {
  return `var(--chart-${(index % PALETTE_SIZE) + 1})`;
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Recharts config keys become CSS variables, so model-provided keys are remapped to safe ones. */
function buildCartesian(chart: AgentChartInput) {
  const keys = chart.series.map((_, index) => `s${index}`);
  const config: ChartConfig = Object.fromEntries(
    chart.series.map((serie, index) => [
      keys[index],
      { label: serie.label, color: color(index) },
    ]),
  );
  const data: ChartRow[] = chart.data.map((row) => ({
    x: String(row[chart.xKey] ?? ""),
    ...Object.fromEntries(
      chart.series.map((serie, index) => [
        keys[index],
        toNumber(row[serie.key]),
      ]),
    ),
  }));
  return { keys, config, data };
}

function AgentPieChart({ chart }: { chart: AgentChartInput }) {
  const valueKey = chart.series[0]?.key;
  const config: ChartConfig = {};
  const slices = chart.data.map((row, index) => {
    const key = `p${index}`;
    config[key] = {
      label: String(row[chart.xKey] ?? key),
      color: color(index),
    };
    return { key, value: valueKey ? toNumber(row[valueKey]) : 0 };
  });
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="flex flex-col items-center gap-3 p-3">
      <DonutChart
        config={config}
        slices={slices}
        centerValue={compact(total)}
        centerLabel="Total"
        className="h-[220px]"
      />
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {slices.map((slice, index) => (
          <li key={slice.key} className="flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ background: color(index) }}
            />
            <span className="truncate">{config[slice.key]?.label}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">
              {formatAgentValue(slice.value, chart.valueFormat)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AgentChart({ chart }: { chart: AgentChartInput }) {
  const formatValue = (value: number) =>
    formatAgentValue(value, chart.valueFormat);

  function renderChart() {
    if (chart.type === "pie") return <AgentPieChart chart={chart} />;

    const { keys, config, data } = buildCartesian(chart);
    const shared = {
      config,
      data,
      xKey: "x" as const,
      yTickFormatter: compact,
      tooltipValueFormatter: formatValue,
      className: "h-[240px]",
    };

    if (chart.type === "bar") {
      return (
        <BarChart {...shared} series={keys.map((dataKey) => ({ dataKey }))} />
      );
    }

    if (chart.type === "area") {
      return (
        <AreaChart {...shared} series={keys.map((dataKey) => ({ dataKey }))} />
      );
    }

    return (
      <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
        <LineChart data={data} margin={{ left: 12, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={48}
            tickFormatter={compact}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, name) => (
                  <div className="flex w-full justify-between gap-3">
                    <span className="text-muted-foreground">
                      {config[String(name)]?.label}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatValue(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          {keys.length > 1 ? (
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}
          {keys.map((key) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    );
  }

  return (
    <AgentPartFrame
      icon={ChartColumn}
      title={chart.title}
      description={chart.description}
    >
      <div className="p-2">{renderChart()}</div>
    </AgentPartFrame>
  );
}
