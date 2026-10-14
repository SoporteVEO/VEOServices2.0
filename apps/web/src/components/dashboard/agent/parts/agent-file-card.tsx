"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AgentExcelInput, AgentPdfInput } from "@/api/agent/agent.types";
import { Button } from "@/components/ui/button";
import {
  downloadAgentExcel,
  downloadAgentPdf,
} from "../files/download-agent-files";
import { AgentPartFrame } from "./agent-part-frame";

type AgentFileCardProps =
  | { kind: "excel"; spec: AgentExcelInput }
  | { kind: "pdf"; spec: AgentPdfInput };

function describe(props: AgentFileCardProps) {
  if (props.kind === "excel") {
    const rows = props.spec.sheets.reduce(
      (sum, sheet) => sum + sheet.rows.length,
      0,
    );
    const sheets = props.spec.sheets.length;
    return `Excel · ${sheets} ${sheets === 1 ? "hoja" : "hojas"} · ${rows} filas`;
  }
  const sections = props.spec.sections.length;
  return `PDF · ${sections} ${sections === 1 ? "sección" : "secciones"}`;
}

export function AgentFileCard(props: AgentFileCardProps) {
  const [downloading, setDownloading] = useState(false);
  const extension = props.kind === "excel" ? "xlsx" : "pdf";
  const name = props.spec.fileName.replace(/\.(xlsx|xls|pdf)$/i, "");

  async function handleDownload() {
    setDownloading(true);
    try {
      if (props.kind === "excel") await downloadAgentExcel(props.spec);
      else await downloadAgentPdf(props.spec);
    } catch {
      toast.error("No se pudo generar el archivo.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AgentPartFrame
      icon={props.kind === "excel" ? FileSpreadsheet : FileText}
      title={`${name}.${extension}`}
      description={describe(props)}
      actions={
        <Button
          sizeVariant="sm"
          icon={downloading ? Loader2 : Download}
          iconClassName={downloading ? "animate-spin" : ""}
          disabled={downloading}
          onClick={handleDownload}
        >
          Descargar
        </Button>
      }
    />
  );
}
