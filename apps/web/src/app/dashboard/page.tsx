"use client";

import { useMemo, useState } from "react";

import { useBillboardDashboardAnalytics } from "@/api/billboards/billboards.get";
import {
  DashboardAvailabilityDonut,
  DashboardDepartmentBreakdownCard,
  DashboardKpisRow,
  DashboardTopBillboards,
  DashboardTopCustomers,
  DashboardTrendChart,
  DashboardYoyChart,
} from "@/components/pages/dashboard";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { parseYYYYMMDD, toYYYYMMDD, formatHumanDate } from "@/lib/format";

function defaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 5, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultTo() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default function DashboardPage() {
  const [fromStr, setFromStr] = useState(() => toYYYYMMDD(defaultFrom()));
  const [toStr, setToStr] = useState(() => toYYYYMMDD(defaultTo()));

  const initialFrom = useMemo(
    () => parseYYYYMMDD(fromStr) ?? defaultFrom(),
    [fromStr],
  );
  const initialTo = useMemo(() => parseYYYYMMDD(toStr) ?? defaultTo(), [toStr]);

  const analyticsQuery = useBillboardDashboardAnalytics({
    from: fromStr,
    to: toStr,
  });

  const data = analyticsQuery.data;
  const isLoading = analyticsQuery.isLoading;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Resumen de operaciones
          </h1>
          <p className="text-xs text-muted-foreground">
            {formatHumanDate(initialFrom)} – {formatHumanDate(initialTo)}
          </p>
        </div>
        <DateRangePicker
          align="end"
          locale="es-ES"
          showCompare={false}
          initialDateFrom={initialFrom}
          initialDateTo={initialTo}
          onUpdate={({ range }) => {
            const to = range.to ?? range.from;
            setFromStr(toYYYYMMDD(range.from));
            setToStr(toYYYYMMDD(to));
          }}
        />
      </header>

      <DashboardKpisRow kpis={data?.kpis} isLoading={isLoading} />

      <DashboardYoyChart yoy={data?.yoyTrend ?? []} isLoading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardTrendChart
            trend={data?.monthlyTrend ?? []}
            isLoading={isLoading}
          />
        </div>
        <DashboardAvailabilityDonut kpis={data?.kpis} isLoading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardTopCustomers
          customers={data?.topCustomers ?? []}
          isLoading={isLoading}
        />
        <DashboardTopBillboards
          billboards={data?.topBillboards ?? []}
          isLoading={isLoading}
        />
      </div>

      <DashboardDepartmentBreakdownCard
        departments={data?.byDepartment ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
