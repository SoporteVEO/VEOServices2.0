"use client";

import { useCallback, useMemo, useState } from "react";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { useSalesByCostCenterReport } from "@/api/analytics/analytics.get";
import type {
  SalesByCostCenterReport,
  SalesByCostCenterRow,
} from "@/api/analytics/analytics.types";
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
import { downloadSalesByCostCenterPdf } from "./download-sales-by-cost-center-pdf";
import { ExportSalesByCostCenterExcelButton } from "./export-sales-by-cost-center-excel";
import { SalesByCostCenterSummaryCards } from "./sales-by-cost-center-summary";
import { SalesByCostCenterTable } from "./sales-by-cost-center-table";

function defaultRange(): { from: Date; to: Date } {
  const previousMonth = subMonths(new Date(), 1);
  return { from: startOfMonth(previousMonth), to: endOfMonth(previousMonth) };
}

function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function rowMatches(row: SalesByCostCenterRow, query: string): boolean {
  if (!query) return true;
  const haystack = normalizeForSearch(
    [
      row.customerName,
      row.sellerName,
      row.subCostCenterName ?? "",
      row.documentType,
      row.guid,
      row.documentNumber ?? "",
    ].join(" "),
  );
  return haystack.includes(normalizeForSearch(query));
}

function filterReport(
  report: SalesByCostCenterReport | undefined,
  query: string,
): SalesByCostCenterReport | undefined {
  if (!report) return undefined;
  if (!query.trim()) return report;
  const filteredRows = report.rows.filter((row) => rowMatches(row, query));
  const total =
    Math.round(filteredRows.reduce((sum, r) => sum + r.total, 0) * 100) / 100;
  return { ...report, rows: filteredRows, total };
}

export function SalesByCostCenterReport() {
  const [range, setRange] = useState(defaultRange);
  const [search, setSearch] = useState("");

  const fromStr = toYYYYMMDD(range.from);
  const toStr = toYYYYMMDD(range.to);
  const { data, isLoading, isFetching, isError } = useSalesByCostCenterReport(
    fromStr,
    toStr,
  );

  const busy = isLoading || isFetching;
  const filteredReport = useMemo(
    () => filterReport(data, search),
    [data, search],
  );
  const visibleRows = filteredReport?.rows ?? [];

  const onPdf = useCallback(async () => {
    if (!filteredReport || filteredReport.rows.length === 0) {
      toast.error("No hay datos para exportar.");
      return;
    }
    try {
      await downloadSalesByCostCenterPdf(filteredReport);
      toast.success("PDF descargado.");
    } catch {
      toast.error("No se pudo generar el PDF.");
    }
  }, [filteredReport]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Ventas por Centro de Costo por Vendedor
          </h2>
          <p className="text-sm text-muted-foreground">
            Reporte de facturación (CCF, FCF, NDC) del centro de costo VEO
            Comunication Group.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>

      <SalesByCostCenterSummaryCards
        report={filteredReport}
        isLoading={busy}
      />

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Detalle de facturas</CardTitle>
            <CardDescription>
              {visibleRows.length} factura
              {visibleRows.length === 1 ? "" : "s"} encontrada
              {visibleRows.length === 1 ? "" : "s"}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SalesByCostCenterTable
            rows={visibleRows}
            isLoading={busy}
            searchValue={search}
            onSearchChange={setSearch}
            sideButtons={
              <div className="flex flex-wrap items-center gap-2">
                <ExportSalesByCostCenterExcelButton
                  report={filteredReport}
                  disabled={busy || isError}
                />
                <Button
                  type="button"
                  variant="outline"
                  icon={FileDown}
                  disabled={
                    busy ||
                    isError ||
                    !filteredReport ||
                    filteredReport.rows.length === 0
                  }
                  onClick={() => void onPdf()}
                >
                  Descargar PDF
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
