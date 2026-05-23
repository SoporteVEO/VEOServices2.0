"use client";

import { useCallback, useMemo, useState } from "react";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { FileDown, FileText } from "lucide-react";
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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { toYYYYMMDD } from "@/lib/format";
import { downloadSalesByCostCenterPdf } from "./download-sales-by-cost-center-pdf";
import { downloadSalesByCostCenterExecutivePdf } from "./download-sales-by-cost-center-executive-pdf";
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

function rowMatchesSearch(row: SalesByCostCenterRow, query: string): boolean {
  if (!query) return true;
  const haystack = normalizeForSearch(
    [
      row.customerName,
      row.sellerName,
      row.costCenterName,
      row.subCostCenterName ?? "",
      row.tipoVentaName,
      row.documentType,
      row.guid,
      row.documentNumber ?? "",
    ].join(" "),
  );
  return haystack.includes(normalizeForSearch(query));
}

function costCenterKey(row: SalesByCostCenterRow): string {
  return String(row.costCenterId ?? row.costCenterName);
}

function filterReport(
  report: SalesByCostCenterReport | undefined,
  query: string,
  costCenterFilter: string | null,
): SalesByCostCenterReport | undefined {
  if (!report) return undefined;
  const hasQuery = Boolean(query.trim());
  const hasCostCenter = costCenterFilter !== null;
  if (!hasQuery && !hasCostCenter) return report;
  const filteredRows = report.rows.filter((row) => {
    if (hasCostCenter && costCenterKey(row) !== costCenterFilter) return false;
    return rowMatchesSearch(row, query);
  });
  const total =
    Math.round(filteredRows.reduce((sum, r) => sum + r.total, 0) * 100) / 100;
  return { ...report, rows: filteredRows, total };
}

export function SalesByCostCenterReport() {
  const [range, setRange] = useState(defaultRange);
  const [search, setSearch] = useState("");
  const [costCenterFilter, setCostCenterFilter] = useState<string | null>(null);
  const [generatingExecutivePdf, setGeneratingExecutivePdf] = useState(false);

  const fromStr = toYYYYMMDD(range.from);
  const toStr = toYYYYMMDD(range.to);
  const { data, isLoading, isFetching, isError } = useSalesByCostCenterReport(
    fromStr,
    toStr,
  );

  const busy = isLoading || isFetching;

  const costCenterOptions = useMemo<ComboboxOption[]>(() => {
    const rows = data?.rows ?? [];
    if (rows.length === 0) return [];
    const seen = new Map<string, string>();
    for (const row of rows) {
      const key = costCenterKey(row);
      if (!seen.has(key)) seen.set(key, row.costCenterName);
    }
    return Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
      );
  }, [data?.rows]);

  const filteredReport = useMemo(
    () => filterReport(data, search, costCenterFilter),
    [data, search, costCenterFilter],
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

  const selectedCostCenterLabel = useMemo(() => {
    if (!costCenterFilter) return null;
    const match = costCenterOptions.find(
      (o) => String(o.value) === costCenterFilter,
    );
    if (!match) return null;
    const label = match.label;
    return typeof label === "string" ? label : String(label);
  }, [costCenterFilter, costCenterOptions]);

  const onExecutivePdf = useCallback(async () => {
    if (!filteredReport || filteredReport.rows.length === 0) {
      toast.error("No hay datos para el reporte.");
      return;
    }
    setGeneratingExecutivePdf(true);
    try {
      await downloadSalesByCostCenterExecutivePdf(filteredReport, {
        filterLabel: selectedCostCenterLabel,
      });
      toast.success("Reporte ejecutivo generado.");
    } catch {
      toast.error("No se pudo generar el reporte.");
    } finally {
      setGeneratingExecutivePdf(false);
    }
  }, [filteredReport, selectedCostCenterLabel]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Facturación por Centro de Costos, Sub Centro y Tipo de Venta
          </h2>
          <p className="text-sm text-muted-foreground">
            Reporte de facturación (CCF, FCF, NDC) con Monto con IVA más
            Impuestos, agrupado por Centro de Costos (Detalle), Sub Centro de
            Costos (Detalle) y Tipo de Venta.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto">
          <Combobox
            triggerClassName="w-64"
            placeholder="Todos los centros de costos"
            emptyLabel="Sin centros de costos."
            options={costCenterOptions}
            value={costCenterFilter}
            disabled={busy && costCenterOptions.length === 0}
            onChange={(v) =>
              setCostCenterFilter(v == null ? null : String(v))
            }
          />
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
            icon={FileText}
            disabled={
              busy ||
              isError ||
              generatingExecutivePdf ||
              !filteredReport ||
              filteredReport.rows.length === 0
            }
            onClick={() => void onExecutivePdf()}
          >
            {generatingExecutivePdf ? "Generando…" : "Generar reporte"}
          </Button>
        </div>
      </div>

      <SalesByCostCenterSummaryCards report={filteredReport} isLoading={busy} />

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Detalle de facturas</CardTitle>
            <CardDescription>
              {visibleRows.length} registro
              {visibleRows.length === 1 ? "" : "s"} (factura × centro de costos
              × tipo de venta). Totales con IVA e impuestos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-[calc(100vh-10rem)] min-h-0 flex-col gap-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
