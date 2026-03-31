"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAvailableBillboardsForReport } from "@/api/billboards/billboards.get";
import {
  generateBillboardReport,
  type ReportProgress,
} from "@/lib/generate-billboard-report";

interface GenerateReportButtonProps {
  from: string;
  to: string;
}

export function GenerateReportButton({ from, to }: GenerateReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ReportProgress | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setProgress({ stage: "Cargando datos", current: 0, total: 1 });

    try {
      const billboards = await getAvailableBillboardsForReport({ from, to });

      if (billboards.length === 0) {
        toast.warning("No hay vallas disponibles para generar el reporte.");
        return;
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
    : "Generar Reporte";

  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? <Loader2 className="animate-spin" /> : <FileText />}
      {label}
    </Button>
  );
}
