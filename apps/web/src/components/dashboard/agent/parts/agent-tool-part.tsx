"use client";

import { Skeleton } from "@/components/primitives/ui/skeleton";
import {
  isToolError,
  isUnauthorized,
  type AgentInventoryInput,
  type AgentMessagePart,
} from "@/api/agent/agent.types";
import { AgentApiCallPart } from "./agent-api-call-part";
import { AgentBriloChangePart } from "./agent-brilo-change-part";
import { AgentChart } from "./agent-chart";
import { AgentDataSourceCard } from "./agent-data-source-card";
import { AgentEmailPart } from "./agent-email-part";
import { AgentFileCard } from "./agent-file-card";
import { AgentImageGallery } from "./agent-image-gallery";
import { AgentMonthlyReportCard } from "./agent-monthly-report-card";
import { AgentOpportunityPart } from "./agent-opportunity-part";
import { AgentProposalCard } from "./agent-proposal-card";
import { AgentReportCard } from "./agent-report-card";
import { AgentResearchCard } from "./agent-research-card";
import { AgentTable } from "./agent-table";
import { AgentTemplateDraftCard } from "./agent-template-draft-card";
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
  remember_learning: "Aprendiendo de tu corrección",
  search_academy: "Buscando en VEO Academy",
  get_academy_article: "Leyendo guía de VEO Academy",
  research_company: "Investigando la marca en la web",
  search_billboard_inventory: "Buscando espacios disponibles",
  create_client_proposal: "Preparando la propuesta",
  draft_crm_template: "Redactando plantilla",
  register_crm_opportunity: "Registrando en el CRM",
  brilo_api_search: "Buscando en la API de Brilo",
  brilo_api_describe: "Leyendo documentación de Brilo",
  brilo_api_get: "Consultando Brilo",
};

function inventoryDetail(
  input:
    | (Pick<AgentInventoryInput, "city" | "department"> & {
        keywords?: (string | undefined)[];
      })
    | undefined,
  output: unknown,
) {
  const place = [input?.city, input?.department, ...(input?.keywords ?? [])]
    .filter(Boolean)
    .join(", ");
  const matched =
    typeof output === "object" && output !== null && "matched" in output
      ? `${(output as { matched: number }).matched} coincidencias`
      : null;
  return [place, matched].filter(Boolean).join(" · ") || undefined;
}

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

    case "tool-ask_data_source":
      return (
        <AgentDataSourceCard
          toolCallId={part.toolCallId}
          topic={part.input?.topic}
          state={part.state}
          chosen={
            part.state === "output-available" ? part.output.source : undefined
          }
        />
      );

    case "tool-remember_learning":
      return (
        <AgentToolStatus
          label={TOOL_LABELS.remember_learning}
          state={part.state}
          input={part.input?.content}
          output={part.state === "output-available" ? part.output : undefined}
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      );

    case "tool-search_academy":
      return (
        <AgentToolStatus
          label={TOOL_LABELS.search_academy}
          detail={part.input?.query}
          state={part.state}
          output={part.state === "output-available" ? part.output : undefined}
        />
      );

    case "tool-get_academy_article":
      return (
        <AgentToolStatus
          label={TOOL_LABELS.get_academy_article}
          detail={part.input?.slug}
          state={part.state}
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      );

    case "tool-research_company": {
      if (part.state === "output-available" && part.output.ok === true) {
        return <AgentResearchCard research={part.output} />;
      }
      if (part.state === "output-available" && isUnauthorized(part.output)) {
        return <AgentUnauthorizedNote message={part.output.message} />;
      }
      return (
        <AgentToolStatus
          label={TOOL_LABELS.research_company}
          detail={part.input?.company}
          state={part.state}
          output={part.state === "output-available" ? part.output : undefined}
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      );
    }

    case "tool-search_billboard_inventory": {
      const output =
        part.state === "output-available" ? part.output : undefined;
      if (isUnauthorized(output))
        return <AgentUnauthorizedNote message={output.message} />;
      return (
        <AgentToolStatus
          label={TOOL_LABELS.search_billboard_inventory}
          detail={inventoryDetail(part.input, output)}
          state={part.state}
          output={output}
          errorText={
            part.state === "output-error"
              ? part.errorText
              : toolErrorText(output)
          }
        />
      );
    }

    case "tool-create_client_proposal": {
      if (part.state === "input-streaming" || !part.input) {
        return <BuildingPlaceholder label="Preparando propuesta…" />;
      }
      if (part.state === "output-available" && part.output.ok === true) {
        return <AgentProposalCard input={part.input} output={part.output} />;
      }
      if (part.state === "output-available" && isUnauthorized(part.output)) {
        return <AgentUnauthorizedNote message={part.output.message} />;
      }
      return (
        <AgentToolStatus
          label={TOOL_LABELS.create_client_proposal}
          detail={part.input.company}
          state={part.state}
          output={part.state === "output-available" ? part.output : undefined}
          errorText={
            part.state === "output-error"
              ? part.errorText
              : part.state === "output-available"
                ? toolErrorText(part.output)
                : undefined
          }
        />
      );
    }

    case "tool-draft_crm_template": {
      if (part.state === "input-streaming" || !part.input) {
        return <BuildingPlaceholder label="Redactando plantilla…" />;
      }
      if (part.state === "output-available" && isUnauthorized(part.output)) {
        return <AgentUnauthorizedNote message={part.output.message} />;
      }
      return <AgentTemplateDraftCard draft={part.input} />;
    }

    case "tool-register_crm_opportunity":
      return (
        <AgentOpportunityPart
          state={part.state}
          input={part.input}
          output={part.state === "output-available" ? part.output : undefined}
          approvalId={"approval" in part ? part.approval?.id : undefined}
        />
      );

    case "tool-brilo_api_change":
      return (
        <AgentBriloChangePart
          state={part.state}
          input={part.input}
          output={part.state === "output-available" ? part.output : undefined}
          errorText={part.state === "output-error" ? part.errorText : undefined}
          approvalId={"approval" in part ? part.approval?.id : undefined}
        />
      );

    case "tool-brilo_api_search":
    case "tool-brilo_api_describe":
    case "tool-brilo_api_get": {
      const output =
        part.state === "output-available" ? part.output : undefined;
      if (isUnauthorized(output))
        return <AgentUnauthorizedNote message={output.message} />;
      const input = part.input as
        | { query?: unknown; path?: string; endpoint?: string; model?: string; module?: string }
        | undefined;
      return (
        <AgentToolStatus
          label={TOOL_LABELS[part.type.slice(5)]}
          detail={
            input?.path ??
            input?.endpoint ??
            input?.model ??
            (typeof input?.query === "string" ? input.query : input?.module)
          }
          state={part.state}
          input={part.type === "tool-brilo_api_get" ? input?.query : undefined}
          output={output}
          errorText={
            part.state === "output-error" ? part.errorText : toolErrorText(output)
          }
        />
      );
    }

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
