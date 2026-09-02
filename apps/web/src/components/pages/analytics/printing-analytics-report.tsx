"use client";

import { useState } from "react";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { usePrintingAnalyticsOverview } from "@/api/analytics/analytics.get";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toYYYYMMDD } from "@/lib/format";
import { PrintingAnalyticsCharts } from "./printing-analytics-charts";
import { PrintingAnalyticsKpis } from "./printing-analytics-kpis";
import { PrintingAnalyticsTables } from "./printing-analytics-tables";

const ALL_MACHINES = "ALL";

function defaultRange(): { from: Date; to: Date } {
  return {
    from: startOfMonth(subMonths(new Date(), 2)),
    to: endOfMonth(new Date()),
  };
}

export function PrintingAnalyticsReport() {
  const [range, setRange] = useState(defaultRange);
  const [machineId, setMachineId] = useState(ALL_MACHINES);

  const fromStr = toYYYYMMDD(range.from);
  const toStr = toYYYYMMDD(range.to);

  const { data, isLoading, isFetching } = usePrintingAnalyticsOverview(
    fromStr,
    toStr,
    { machineId: machineId === ALL_MACHINES ? null : machineId },
  );

  const busy = isLoading || isFetching;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Máquinas de impresión
          </h2>
          <p className="text-sm text-muted-foreground">
            Uso de las máquinas, tiempos por fase y cumplimiento del calendario
            de impresión.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-52">
            <Select value={machineId} onValueChange={setMachineId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MACHINES}>Todas las máquinas</SelectItem>
                {(data?.machines ?? []).map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

      <PrintingAnalyticsKpis overview={data} isLoading={busy} />

      <PrintingAnalyticsCharts overview={data} isLoading={busy} />

      <PrintingAnalyticsTables overview={data} isLoading={busy} />
    </div>
  );
}
