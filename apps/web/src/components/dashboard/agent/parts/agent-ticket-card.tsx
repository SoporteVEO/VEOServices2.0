"use client";

import { Copy, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import type { AgentIssueReportOutput } from "@/api/agent/agent.types";
import { AgentIconButton } from "../agent-icon-button";
import { AgentPartFrame } from "./agent-part-frame";

export function AgentTicketCard({
  report,
}: {
  report: AgentIssueReportOutput;
}) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(report.ticket);
      toast.success(`Ticket ${report.ticket} copiado`);
    } catch {
      toast.error("No se pudo copiar el número de ticket");
    }
  }

  return (
    <AgentPartFrame
      icon={LifeBuoy}
      title="Reportado al equipo de desarrollo"
      description={report.title}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Número de ticket
          </p>
          <p className="font-mono text-lg font-semibold tracking-wide">
            {report.ticket}
          </p>
        </div>
        <AgentIconButton
          label="Copiar número de ticket"
          icon={Copy}
          onClick={handleCopy}
        />
      </div>
    </AgentPartFrame>
  );
}
