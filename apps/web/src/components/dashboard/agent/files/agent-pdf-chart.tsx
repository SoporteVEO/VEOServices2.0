import { Text, View } from "@react-pdf/renderer";
import type { AgentPdfChart } from "@/api/agent/agent.types";
import { formatAgentValue } from "@/lib/agent-format";
import { BRAND_COLORS } from "@/lib/brand-colors";
import { pdfStyles } from "./agent-pdf-styles";

function barColor(value: number, rank: number) {
  if (value < 0) return BRAND_COLORS.red;
  return rank === 0 ? BRAND_COLORS.lime : BRAND_COLORS.gray;
}

/** Ranking bars: the leader is the only lime bar, since lime signals. */
export function AgentPdfChartBlock({ chart }: { chart: AgentPdfChart }) {
  const data = [...chart.data].sort((a, b) => b.value - a.value);
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const positiveTotal = data.reduce((sum, d) => sum + Math.max(d.value, 0), 0);
  const showShare = chart.valueFormat !== "percent" && positiveTotal > 0;

  return (
    <View style={pdfStyles.chart} wrap={false}>
      {chart.title ? (
        <Text style={pdfStyles.chartTitle}>{chart.title}</Text>
      ) : null}
      {data.map((point, rank) => (
        <View key={`${point.label}-${rank}`} style={pdfStyles.chartRow}>
          <Text style={pdfStyles.chartLabel}>{point.label}</Text>
          <View style={pdfStyles.chartTrack}>
            <View
              style={[
                pdfStyles.chartBar,
                {
                  width: `${Math.max((Math.abs(point.value) / max) * 100, 1)}%`,
                  backgroundColor: barColor(point.value, rank),
                },
              ]}
            />
          </View>
          <Text style={pdfStyles.chartValue}>
            {formatAgentValue(point.value, chart.valueFormat ?? "number")}
          </Text>
          {showShare ? (
            <Text style={pdfStyles.chartShare}>
              {point.value > 0
                ? `${((point.value / positiveTotal) * 100).toFixed(1)}%`
                : "—"}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
