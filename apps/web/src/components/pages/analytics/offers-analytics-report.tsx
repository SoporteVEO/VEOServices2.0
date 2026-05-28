"use client";

import { useMemo, useState } from "react";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { useOffersAnalyticsOverview } from "@/api/analytics/analytics.get";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { toYYYYMMDD } from "@/lib/format";
import { AnalyticsUserFilter } from "./analytics-user-filter";
import { OffersAnalyticsCharts } from "./offers-analytics-charts";
import { OffersAnalyticsKpis } from "./offers-analytics-kpis";
import { OffersAnalyticsTables } from "./offers-analytics-tables";

function defaultRange(): { from: Date; to: Date } {
  const previousMonth = subMonths(new Date(), 2);
  const start = startOfMonth(previousMonth);
  const end = endOfMonth(new Date());
  return { from: start, to: end };
}

export function OffersAnalyticsReport() {
  const [range, setRange] = useState(defaultRange);
  const [userId, setUserId] = useState<string | null>(null);

  const fromStr = toYYYYMMDD(range.from);
  const toStr = toYYYYMMDD(range.to);

  const { data, isLoading, isFetching } = useOffersAnalyticsOverview(
    fromStr,
    toStr,
    { userId },
  );

  const busy = isLoading || isFetching;
  const rangeReady = useMemo(
    () => Boolean(fromStr && toStr && fromStr <= toStr),
    [fromStr, toStr],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Resumen de cotizaciones
          </h2>
          <p className="text-sm text-muted-foreground">
            Métricas de cotizaciones creadas en la plataforma.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <AnalyticsUserFilter
            value={userId}
            onChange={setUserId}
            className="w-full sm:w-72"
          />
          <DateRangePicker
            key={`${fromStr}-${toStr}`}
            showCompare={false}
            initialDateFrom={range.from}
            initialDateTo={range.to}
            align="end"
            onUpdate={({ range: next }) => {
              if (next.to) setRange({ from: next.from, to: next.to });
              else setRange({ from: next.from, to: next.from });
            }}
          />
        </div>
      </div>

      <OffersAnalyticsKpis overview={data} isLoading={busy} />

      <OffersAnalyticsCharts overview={data} isLoading={busy} />

      <OffersAnalyticsTables
        overview={data}
        isLoading={busy}
        from={fromStr}
        to={toStr}
        userId={userId}
        rangeReady={rangeReady}
      />
    </div>
  );
}
