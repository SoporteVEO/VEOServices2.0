"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { getAvailableBillboardsForReport } from "@/api/billboards/billboards.get";
import type { AgentReportOutput } from "@/api/agent/agent.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format";
import {
  generateAvailabilityReport,
  type ReportProgress,
} from "@/components/pages/static-billboards/availability-report/generate-availability-report";
import { AgentPartFrame } from "./agent-part-frame";

const VISIBLE_CODES = 12;

export function AgentReportCard({ report }: { report: AgentReportOutput }) {
  const [progress, setProgress] = useState<ReportProgress | null>(null);
  const isGenerating = progress !== null;

  async function handleGenerate() {
    setProgress({ stage: "Cargando datos", current: 0, total: 1 });
    try {
      const billboards = await getAvailableBillboardsForReport({
        from: report.from,
        to: report.to,
        billboardIds: report.billboardIds ?? [],
      });
      if (billboards.length === 0) {
        toast.warning("No hay vallas disponibles para generar el reporte.");
        return;
      }
      await generateAvailabilityReport({
        billboards,
        dateFrom: report.from,
        onProgress: setProgress,
      });
      toast.success("Reporte generado correctamente.");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("No se pudo generar el reporte.");
    } finally {
      setProgress(null);
    }
  }

  const label = progress
    ? `${progress.stage}${progress.total > 1 ? ` (${progress.current}/${progress.total})` : ""}`
    : "Descargar reporte";

  return (
    <AgentPartFrame
      icon={FileText}
      title="Reporte de vallas estáticas disponibles"
      description={`${formatDateRange(report.from, report.to)} · ${report.count} ${report.count === 1 ? "valla" : "vallas"}`}
    >
      <div className="space-y-3 p-3">
        {report.codes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {report.codes.slice(0, VISIBLE_CODES).map((code) => (
              <Badge
                key={code}
                variant="secondary"
                className="font-mono text-[11px]"
              >
                {code}
              </Badge>
            ))}
            {report.count > VISIBLE_CODES ? (
              <Badge variant="outline" className="text-[11px]">
                +{report.count - VISIBLE_CODES}
              </Badge>
            ) : null}
          </div>
        ) : null}
        {report.missingCodes.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            No encontrados: {report.missingCodes.join(", ")}
          </p>
        ) : null}
        <Button
          className="w-full justify-center"
          icon={FileText}
          loading={isGenerating}
          disabled={isGenerating || report.count === 0}
          onClick={handleGenerate}
        >
          {label}
        </Button>
      </div>
    </AgentPartFrame>
  );
}
