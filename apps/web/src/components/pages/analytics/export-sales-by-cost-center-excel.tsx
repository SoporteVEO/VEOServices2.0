"use client";

import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { SalesByCostCenterReport } from "@/api/analytics/analytics.types";
import { Button } from "@/components/ui/button";

function formatExcelDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function reportToSheetData(report: SalesByCostCenterReport) {
  return report.rows.map((row) => ({
    "Centro de Costos (Detalle)": row.costCenterName,
    "Sub Centro de Costos (Detalle)": row.subCostCenterName ?? "",
    "Tipo de Venta": row.tipoVentaName,
    Vendedor: row.sellerName,
    Cliente: row.customerName,
    "Monto con IVA mas Impuestos": row.total,
    Fecha: formatExcelDate(row.date),
    Tipo: row.documentType,
    "Num. Documento": row.guid || row.documentNumber || "",
  }));
}

export function ExportSalesByCostCenterExcelButton({
  report,
  disabled,
}: {
  report: SalesByCostCenterReport | undefined;
  disabled?: boolean;
}) {
  async function handleClick() {
    if (!report || report.rows.length === 0) {
      toast.warning("No hay datos para exportar.");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(reportToSheetData(report));

      ws["!cols"] = [
        { wch: 30 },
        { wch: 30 },
        { wch: 20 },
        { wch: 28 },
        { wch: 40 },
        { wch: 22 },
        { wch: 12 },
        { wch: 6 },
        { wch: 40 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ventas");
      XLSX.writeFile(
        wb,
        `ventas-centro-costo_${report.range.from}_${report.range.to}.xlsx`,
      );
      toast.success("Archivo descargado.");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo exportar a Excel.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || !report || report.rows.length === 0}
      onClick={() => void handleClick()}
    >
      <FileSpreadsheet />
      Exportar Excel
    </Button>
  );
}
