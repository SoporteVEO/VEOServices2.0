"use client";

import { useCallback, useState } from "react";
import { subDays } from "date-fns";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { useUserAppUsageReport } from "@/api/analytics/analytics.get";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { toYYYYMMDD } from "@/lib/format";
import { downloadUserAppUsagePdf } from "./download-user-app-usage-pdf";
import { UserAppUsageCharts } from "./user-app-usage-charts";
import { UserAppUsageTable } from "./user-app-usage-table";

function defaultRange(): { from: Date; to: Date } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  return { from: subDays(end, 29), to: end };
}

export function UserAppUsageReport() {
  const [range, setRange] = useState(defaultRange);
  const fromStr = toYYYYMMDD(range.from);
  const toStr = toYYYYMMDD(range.to);
  const { data, isLoading, isFetching, isError } = useUserAppUsageReport(
    fromStr,
    toStr,
  );

  const busy = isLoading || isFetching;

  const onPdf = useCallback(async () => {
    if (!data) {
      toast.error("No hay datos para exportar.");
      return;
    }
    try {
      await downloadUserAppUsagePdf(data);
      toast.success("PDF descargado.");
    } catch {
      toast.error("No se pudo generar el PDF.");
    }
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center justify-end">
        <DateRangePicker
          key={`${fromStr}-${toStr}`}
          showCompare={false}
          initialDateFrom={range.from}
          initialDateTo={range.to}
          onUpdate={({ range: next }) => {
            if (next.to) setRange({ from: next.from, to: next.to });
            else setRange({ from: next.from, to: next.from });
          }}
        />
        <Button
          type="button"
          variant="outline"
          icon={FileDown}
          disabled={busy || !data || isError}
          onClick={() => void onPdf()}
        >
          Descargar PDF
        </Button>
      </div>

      <UserAppUsageCharts report={data} isLoading={busy} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserAppUsageTable users={data?.users ?? []} isLoading={busy} />
        </CardContent>
      </Card>
    </div>
  );
}
