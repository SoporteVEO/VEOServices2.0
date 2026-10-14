"use client";

import { Skeleton } from "@/components/primitives/ui/skeleton";
import {
  isToolError,
  isUnauthorized,
  type AgentMessagePart,
} from "@/api/agent/agent.types";
import { AgentApiCallPart } from "./agent-api-call-part";
import { AgentChart } from "./agent-chart";
import { AgentEmailPart } from "./agent-email-part";
import { AgentFileCard } from "./agent-file-card";
import { AgentImageGallery } from "./agent-image-gallery";
import { AgentMonthlyReportCard } from "./agent-monthly-report-card";
import { AgentReportCard } from "./agent-report-card";
import { AgentTable } from "./agent-table";
import { AgentTicketCard } from "./agent-ticket-card";
import { AgentToolStatus } from "./agent-tool-status";
import { AgentUnauthorizedNote } from "./agent-unauthorized-note";

const TOOL_LABELS: Record<string, string> = {
  list_api_endpoints: "Revisando capacidades",
  generate_static_billboards_report: "Consultando disponibilidad",
  generate_monthly_report: "Preparando reporte mensual",
  get_billboard_images: "Buscando imágenes",
  get_sales_summary: "Consultando ventas",
  run_query: "Consultando el ERP",
  report_issue: "Reportando el problema al equipo de desarrollo",
};

function BuildingPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full space-y-2 rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function toolErrorText(output: unknown) {
  return isToolError(output) && "error" in output
    ? (output.error ?? undefined)
    : undefined;
}

export function AgentToolPart({ part }: { part: AgentMessagePart }) {
  switch (part.type) {
    case "tool-show_table":
      return part.state === "input-streaming" || !part.input ? (
        <BuildingPlaceholder label="Construyendo tabla…" />
      ) : (
        <AgentTable table={part.input} />
      );

    case "tool-show_chart":
      return part.state === "input-streaming" || !part.input ? (
        <BuildingPlaceholder label="Construyendo gráfico…" />
      ) : (
        <AgentChart chart={part.input} />
      );

    case "tool-create_excel_file":
      return part.state === "input-streaming" || !part.input ? (
        <BuildingPlaceholder label="Preparando Excel…" />
      ) : (
        <AgentFileCard kind="excel" spec={part.input} />
      );

    case "tool-create_pdf_document":
      return part.state === "input-streaming" || !part.input ? (
        <BuildingPlaceholder label="Preparando PDF…" />
      ) : (
        <AgentFileCard kind="pdf" spec={part.input} />
      );

    case "tool-generate_static_billboards_report":
    case "tool-generate_monthly_report":
    case "tool-get_billboard_images": {
      const name = part.type.slice(5);
      if (part.state !== "output-available") {
        return (
          <AgentToolStatus
            label={TOOL_LABELS[name] ?? name}
            state={part.state}
            input={part.input}
            errorText={part.errorText}
          />
        );
      }
      const output = part.output;
      if (isUnauthorized(output))
        return <AgentUnauthorizedNote message={output.message} />;
      if (output.ok === false) {
        return (
          <AgentToolStatus
            label={TOOL_LABELS[name] ?? name}
            state={part.state}
            input={part.input}
            output={output}
            errorText={toolErrorText(output)}
          />
        );
      }
      if ("fetchedAt" in output) return <AgentImageGallery output={output} />;
      if ("contracts" in output)
        return <AgentMonthlyReportCard report={output} />;
      return <AgentReportCard report={output} />;
    }

    case "tool-send_email":
      return (
        <AgentEmailPart
          state={part.state}
          input={part.input}
          output={part.state === "output-available" ? part.output : undefined}
          approvalId={"approval" in part ? part.approval?.id : undefined}
        />
      );

    case "tool-call_api":
      return (
        <AgentApiCallPart
          state={part.state}
          input={part.input}
          output={part.state === "output-available" ? part.output : undefined}
          errorText={part.state === "output-error" ? part.errorText : undefined}
          approvalId={"approval" in part ? part.approval?.id : undefined}
        />
      );

    case "tool-report_issue":
      return part.state === "output-available" && part.output.ok ? (
        <AgentTicketCard report={part.output} />
      ) : (
        <AgentToolStatus
          label={TOOL_LABELS.report_issue}
          state={part.state}
          output={part.state === "output-available" ? part.output : undefined}
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      );

    case "tool-list_api_endpoints":
      return (
        <AgentToolStatus
          label={TOOL_LABELS.list_api_endpoints}
          detail={part.input?.scope ?? part.input?.search}
          state={part.state}
          output={part.state === "output-available" ? part.output : undefined}
        />
      );

    case "dynamic-tool":
      return (
        <AgentToolStatus
          label={TOOL_LABELS[part.toolName] ?? part.toolName}
          state={part.state}
          input={part.input}
          output={part.state === "output-available" ? part.output : undefined}
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      );

    default:
      return null;
  }
}
