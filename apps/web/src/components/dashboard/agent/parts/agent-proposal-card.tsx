"use client";

import { useState } from "react";
import { Briefcase, Download, FileText, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAgentCapabilities } from "@/api/agent/agent.get";
import type {
  AgentProposalInput,
  AgentProposalOutput,
} from "@/api/agent/agent.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { formatReportProgress } from "@/components/pages/reports/contract-report-actions";
import type { ContractReportProgress } from "@/components/pages/reports/pdf/generate-contract-report";
import { generateClientProposal } from "@/components/pages/reports/pdf/proposal/generate-client-proposal";
import { formatDateRange, formatMoney } from "@/lib/format";
import { downloadBlob } from "@/lib/pdf-download";
import { useAgentChatActions } from "../agent-chat-context";
import { AgentPartFrame } from "./agent-part-frame";

export function AgentProposalCard({
  input,
  output,
}: {
  input: AgentProposalInput;
  output: AgentProposalOutput;
}) {
  const [progress, setProgress] = useState<ContractReportProgress | null>(null);
  const busy = progress !== null;
  const { sendText, isBusy } = useAgentChatActions();
  const { data: capabilities } = useAgentCapabilities();
  const canUseCrm = capabilities?.scopes.some((scope) => scope.key === "crm");

  const reasons = new Map(
    input.billboards.map((b) => [b.code.trim().toUpperCase(), b.reason]),
  );
  const picks = output.included.map((item) => ({
    ...item,
    reason: reasons.get(item.code.trim().toUpperCase()) ?? "",
  }));
  const unavailable = [...output.occupiedCodes, ...output.missingCodes];
  const addressee = input.contact?.name
    ? `${input.contact.name} · ${input.contact.role ?? "Gerente de Marketing"}`
    : (input.contact?.role ?? "Gerente de Marketing");

  async function handleDownload() {
    setProgress({ stage: "Cargando vallas", current: 0, total: 1 });
    try {
      const result = await generateClientProposal({
        company: input.company,
        contact: input.contact,
        objective: input.objective,
        from: output.from,
        to: output.to,
        brandSummary: input.brandSummary,
        audience: input.audience,
        strategy: input.strategy,
        billboards: picks,
        preparedBy: output.preparedBy,
        preparedByEmail: output.preparedByEmail,
        createdAt: output.createdAt,
        onProgress: setProgress,
      });
      downloadBlob(result.blob, result.fileName);
      if (result.skippedCodes.length > 0) {
        toast.warning(
          `Se omitieron vallas que ya no están disponibles: ${result.skippedCodes.join(", ")}`,
        );
      } else {
        toast.success("Propuesta generada correctamente.");
      }
    } catch (error) {
      console.error("Error generating client proposal:", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo generar la propuesta.",
      );
    } finally {
      setProgress(null);
    }
  }

  return (
    <AgentPartFrame
      icon={FileText}
      title={`Propuesta para ${output.company}`}
      description={`${addressee} · ${formatDateRange(`${output.from}T00:00:00`, `${output.to}T00:00:00`)}`}
      actions={
        <Badge variant="secondary" className="text-[11px] tabular-nums">
          {formatMoney(output.monthlyInvestment)}/mes
        </Badge>
      }
    >
      <p className="border-b px-3 py-2 text-xs text-muted-foreground">
        {input.objective}
      </p>
      <ul className="max-h-64 divide-y overflow-y-auto">
        {picks.map((pick) => (
          <li key={pick.billboardId} className="flex gap-3 px-3 py-2">
            <span className="w-20 shrink-0 font-mono text-xs font-semibold">
              {pick.code}
            </span>
            <span className="min-w-0 flex-1 text-xs">
              <span className="text-muted-foreground">{pick.city ?? "—"}</span>
              {pick.reason ? <span className="block">{pick.reason}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      {unavailable.length > 0 ? (
        <p className="flex items-start gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
          No incluidas por no estar disponibles: {unavailable.join(", ")}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 border-t p-3">
        <Button
          className="w-full justify-center"
          icon={Download}
          loading={busy}
          disabled={busy}
          onClick={handleDownload}
        >
          {busy ? formatReportProgress(progress) : "Descargar propuesta (PDF)"}
        </Button>
        {canUseCrm ? (
          <Button
            variant="outline"
            className="w-full justify-center"
            icon={Briefcase}
            disabled={isBusy}
            onClick={() =>
              sendText(
                `Registra a ${output.company} en el CRM y crea el negocio en "Negocio Potencial" con esta propuesta.`,
              )
            }
          >
            Crear negocio en el CRM
          </Button>
        ) : null}
      </div>
    </AgentPartFrame>
  );
}
