"use client";

import { useId, useMemo, useState } from "react";
import { useAvailableBillboardsInRange } from "@/api/billboards/billboards.get";
import { toYYYYMMDD, parseYYYYMMDD } from "@/lib/format";
import {
  StaticBillboardsTable,
  GenerateReportButton,
  ExportStaticBillboardsExcelButton,
  GenerateQuotationButton,
} from "@/components/pages/static-billboards";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Switch } from "@/components/primitives/ui/switch";
import { Label } from "@/components/primitives/ui/label";

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
  const showAllId = useId();
  const [fromStr, setFromStr] = useState(() => toYYYYMMDD(defaultFrom()));
  const [toStr, setToStr] = useState(() =>
    toYYYYMMDD(addDays(defaultFrom(), 30)),
  );
  const [showAll, setShowAll] = useState(false);

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
    includeUnavailable: showAll,
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-0 flex-col gap-4">
      <StaticBillboardsTable
        billboards={billboardsQuery.data ?? []}
        isLoading={billboardsQuery.isLoading}
        showAvailabilityColumn={showAll}
        enableRowSelection
        sideButtons={({ filtered, selectedRows, clearSelection }) => (
          <>
            <div className="flex items-center gap-2">
              <Switch
                id={showAllId}
                checked={showAll}
                onCheckedChange={setShowAll}
                className="bg-input"
              />
              <Label htmlFor={showAllId} className="text-sm font-normal">
                Mostrar ocupadas
              </Label>
            </div>
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
            <GenerateQuotationButton
              selectedRows={selectedRows}
              defaultStartDate={initialFrom}
              defaultEndDate={initialTo}
              onSuccess={clearSelection}
            />
            <ExportStaticBillboardsExcelButton
              rows={filtered}
              from={fromStr}
              to={toStr}
              disabled={billboardsQuery.isLoading}
              includeAvailabilityColumn={showAll}
            />
            <GenerateReportButton from={fromStr} to={toStr} />
          </>
        )}
      />
    </div>
  );
}
