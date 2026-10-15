"use client";

import { useState } from "react";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { useReportsAnalyticsOverview } from "@/api/analytics/analytics.get";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { toYYYYMMDD } from "@/lib/format";
import { AnalyticsUserFilter } from "./analytics-user-filter";
import { ReportsAnalyticsCharts } from "./reports-analytics-charts";
import { ReportsAnalyticsKpis } from "./reports-analytics-kpis";
import { ReportsAnalyticsTables } from "./reports-analytics-tables";

function defaultRange(): { from: Date; to: Date } {
  const previousMonth = subMonths(new Date(), 2);
  return {
    from: startOfMonth(previousMonth),
    to: endOfMonth(new Date()),
  };
}

export function ReportsAnalyticsReport() {
  const [range, setRange] = useState(defaultRange);
  const [userId, setUserId] = useState<string | null>(null);

  const fromStr = toYYYYMMDD(range.from);
  const toStr = toYYYYMMDD(range.to);

  const { data, isLoading, isFetching } = useReportsAnalyticsOverview(
    fromStr,
    toStr,
    { userId },
  );
  const busy = isLoading || isFetching;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 @xl/main:flex-row @xl/main:flex-wrap @xl/main:items-end @xl/main:justify-end">
        <div className="flex flex-col gap-2 @xl/main:flex-row @xl/main:items-center">
          <AnalyticsUserFilter
            value={userId}
            onChange={setUserId}
            className="w-full @xl/main:w-72"
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

      <ReportsAnalyticsKpis overview={data} isLoading={busy} />

      <ReportsAnalyticsCharts overview={data} isLoading={busy} />

      <ReportsAnalyticsTables overview={data} isLoading={busy} />
    </div>
  );
}
