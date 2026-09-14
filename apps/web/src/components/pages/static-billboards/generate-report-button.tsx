"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { getAvailableBillboardsForReport } from "@/api/billboards/billboards.get";
import {
  generateBillboardReport,
  type ReportProgress,
} from "@/lib/generate-billboard-report";

interface GenerateReportButtonProps {
  from: string;
  to: string;
  /** Rows ticked in the table. When empty the report covers `visibleRows`. */
  selectedRows?: AvailableBillboardListing[];
  /** Rows left by the current search and filters. */
  visibleRows?: AvailableBillboardListing[];
}

export function GenerateReportButton({
  from,
  to,
  selectedRows = [],
  visibleRows = [],
}: GenerateReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ReportProgress | null>(null);

  // A tick beats the filters, and the filters beat the whole inventory. Sending
  // no ids at all is what makes the endpoint fall back to everything available.
  const scoped = selectedRows.length > 0 ? selectedRows : visibleRows;
  const billboardIds = scoped.map((b) => b.billboardId);
  const count = scoped.length;

  async function handleGenerate() {
    setIsGenerating(true);
    setProgress({ stage: "Cargando datos", current: 0, total: 1 });

    try {
      const billboards = await getAvailableBillboardsForReport({
        from,
        to,
        billboardIds,
      });

      if (billboards.length === 0) {
        toast.warning("No hay vallas disponibles para generar el reporte.");
        return;
      }

      // Occupied vallas can be ticked while "Mostrar ocupadas" is on, but the
      // availability report only covers free ones. Say so instead of quietly
      // handing over a shorter deck than the user picked.
      const skipped = count > 0 ? count - billboards.length : 0;
      if (skipped > 0) {
        toast.warning(
          `${skipped} ${skipped === 1 ? "valla no está" : "vallas no están"} disponible${
            skipped === 1 ? "" : "s"
          } en estas fechas y quedó${skipped === 1 ? "" : "n"} fuera del reporte.`,
        );
      }

      await generateBillboardReport({
        billboards,
        dateFrom: from,
        dateTo: to,
        onProgress: setProgress,
      });

      toast.success("Reporte generado correctamente.");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("No se pudo generar el reporte.");
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  }

  const label = progress
    ? `${progress.stage}${progress.total > 1 ? ` (${progress.current}/${progress.total})` : ""}`
    : count > 0
      ? `Generar Reporte (${count})`
      : "Generar Reporte";

  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleGenerate}
      disabled={isGenerating}
      title={
        selectedRows.length > 0
          ? `Reporte de las ${selectedRows.length} vallas seleccionadas`
          : "Reporte de las vallas que muestra la tabla"
      }
    >
      {isGenerating ? <Loader2 className="animate-spin" /> : <FileText />}
      {label}
    </Button>
  );
}
