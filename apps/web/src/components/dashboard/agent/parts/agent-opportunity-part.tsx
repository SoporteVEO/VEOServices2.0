"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { DeepPartial } from "ai";
import { Briefcase, ExternalLink, Kanban, TriangleAlert } from "lucide-react";
import {
  isToolError,
  isUnauthorized,
  type AgentOpportunityInput,
  type AgentOpportunityOutput,
  type AgentToolError,
  type AgentUnauthorized,
} from "@/api/agent/agent.types";
import { crmKeys } from "@/api/crm/crm.get";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { CrmDealDrawer } from "@/components/pages/crm/deal/crm-deal-drawer";
import { formatDateRange, formatMoney, parseYYYYMMDD } from "@/lib/format";
import { AgentApprovalCard } from "./agent-approval-card";
import { AgentUnauthorizedNote } from "./agent-unauthorized-note";

interface AgentOpportunityPartProps {
  state: string;
  input: DeepPartial<AgentOpportunityInput> | undefined;
  output?: AgentOpportunityOutput | AgentUnauthorized | AgentToolError;
  approvalId?: string;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-xs">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

function OpportunityResult({ output }: { output: AgentOpportunityOutput }) {
  const queryClient = useQueryClient();
  const [openDealId, setOpenDealId] = useState<string | null>(null);

  function refreshCrm() {
    void queryClient.invalidateQueries({ queryKey: crmKeys.all });
  }

  return (
    <div className="space-y-2">
      <p>
        Negocio creado en <strong>{output.deal.stage}</strong>
        {output.sitesAdded > 0
          ? ` con ${output.sitesAdded} vallas${output.sitesHeld > 0 ? ` (${output.sitesHeld} reservadas)` : ""}`
          : ""}
        {output.deal.value > 0 ? ` · ${formatMoney(output.deal.value)}` : ""}.
      </p>
      {output.warnings.length > 0 ? (
        <p className="flex items-start gap-1.5 text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
          {output.warnings.join(" ")}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          sizeVariant="sm"
          icon={ExternalLink}
          onClick={() => {
            refreshCrm();
            setOpenDealId(output.deal.id);
          }}
        >
          Abrir negocio
        </Button>
        <Button asChild variant="outline" sizeVariant="sm">
          <Link href="/dashboard/crm/pipeline" onClick={refreshCrm}>
            <Kanban className="size-4" />
            Ver pipeline
          </Link>
        </Button>
      </div>
      <CrmDealDrawer
        dealId={openDealId}
        onOpenChange={(open) => {
          if (!open) setOpenDealId(null);
        }}
      />
    </div>
  );
}

export function AgentOpportunityPart({
  state,
  input,
  output,
  approvalId,
}: AgentOpportunityPartProps) {
  if (isUnauthorized(output))
    return <AgentUnauthorizedNote message={output.message} />;

  const client = input?.client;
  const isNewClient = !client?.id;
  const contact = input?.contact;
  const codes = (input?.billboardCodes ?? []).filter(Boolean);
  const from = parseYYYYMMDD(input?.deal?.from);
  const to = parseYYYYMMDD(input?.deal?.to);

  return (
    <AgentApprovalCard
      icon={Briefcase}
      title={input?.deal?.title ?? "Nuevo negocio"}
      description={
        state === "approval-requested"
          ? "Revisa los datos antes de registrarlos en el CRM"
          : `CRM · ${input?.stageName ?? "Negocio Potencial"}`
      }
      state={state}
      approvalId={approvalId}
      approveLabel="Registrar en CRM"
      result={
        output && !isToolError(output) ? (
          <OpportunityResult output={output as AgentOpportunityOutput} />
        ) : (
          <span className="text-destructive">
            {output && "error" in output
              ? output.error
              : "No se pudo registrar el negocio."}
          </span>
        )
      }
    >
      <div className="space-y-1.5">
        <Row label="Cliente">
          <span className="font-medium">{client?.name}</span>
          {client?.company ? ` · ${client.company}` : null}{" "}
          <Badge variant={isNewClient ? "default" : "secondary"} className="ml-1 h-4 text-[10px]">
            {isNewClient ? "Nuevo" : "Existente"}
          </Badge>
          {isNewClient && client?.email ? (
            <span className="block text-muted-foreground">{client.email}</span>
          ) : null}
        </Row>
        {contact?.firstName ? (
          <Row label="Contacto">
            {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
            {contact.jobTitle ? ` · ${contact.jobTitle}` : null}
            {contact.email ? (
              <span className="block text-muted-foreground">{contact.email}</span>
            ) : null}
          </Row>
        ) : null}
        <Row label="Etapa">{input?.stageName ?? "Negocio Potencial"}</Row>
        {from && to ? (
          <Row label="Campaña">
            {formatDateRange(from, to)}
          </Row>
        ) : null}
        {codes.length > 0 ? (
          <Row label={input?.hold ? "Reservar" : "Vallas"}>
            <span className="font-mono">{codes.join(", ")}</span>
          </Row>
        ) : null}
      </div>
    </AgentApprovalCard>
  );
}
