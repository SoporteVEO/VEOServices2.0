"use client";

import { useMemo, useState } from "react";
import { useAvailableBillboardsInRange } from "@/api/billboards/billboards.get";
import { toYYYYMMDD, parseYYYYMMDD } from "@/lib/format";
import {
  StaticBillboardsTable,
  GenerateReportButton,
} from "@/components/pages/static-billboards";
import { DateRangePicker } from "@/components/ui/date-range-picker";

function defaultFrom() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function StaticBillboardsPage() {
  const [fromStr, setFromStr] = useState(() => toYYYYMMDD(defaultFrom()));
  const [toStr, setToStr] = useState(() =>
    toYYYYMMDD(addDays(defaultFrom(), 30)),
  );

  const initialFrom = useMemo(
    () => parseYYYYMMDD(fromStr) ?? defaultFrom(),
    [fromStr],
  );
  const initialTo = useMemo(
    () => parseYYYYMMDD(toStr) ?? addDays(defaultFrom(), 30),
    [toStr],
  );

  const billboardsQuery = useAvailableBillboardsInRange({
    from: fromStr,
    to: toStr,
  });

  return (
    <StaticBillboardsTable
      billboards={billboardsQuery.data ?? []}
      isLoading={billboardsQuery.isLoading}
      sideButtons={
        <>
          <DateRangePicker
            align="start"
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
          <GenerateReportButton from={fromStr} to={toStr} />
        </>
      }
    />
  );
}
