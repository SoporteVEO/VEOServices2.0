"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { RadarChart, type RadarChartSeries } from "@/components/ui/radar-chart";
import type { ChartConfig } from "@/components/primitives/ui/chart";

type KpiDatum = {
  kpi: string;
  score: number;
};

const KPI_DATA: KpiDatum[] = [
  { kpi: "Productividad", score: 82 },
  { kpi: "Calidad", score: 75 },
  { kpi: "Colaboración", score: 90 },
  { kpi: "Iniciativa", score: 68 },
  { kpi: "Asistencia", score: 95 },
  { kpi: "Aprendizaje", score: 78 },
];

const KPI_CHART_CONFIG = {
  score: {
    label: "Puntuación",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const KPI_SERIES: RadarChartSeries<KpiDatum>[] = [{ dataKey: "score" }];

export function ProfileKpis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempeño</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <RadarChart
          config={KPI_CHART_CONFIG}
          data={KPI_DATA}
          angleKey="kpi"
          series={KPI_SERIES}
          radiusAxisDomain={[0, 100]}
          fillOpacity={0.4}
          hideTooltipLabel={false}
        />
      </CardContent>
    </Card>
  );
}
