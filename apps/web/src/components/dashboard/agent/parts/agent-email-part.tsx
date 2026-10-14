"use client";

import type { DeepPartial } from "ai";
import { FileSpreadsheet, Mail } from "lucide-react";
import {
  isToolError,
  isUnauthorized,
  type AgentEmailInput,
  type AgentEmailOutput,
  type AgentToolError,
  type AgentUnauthorized,
} from "@/api/agent/agent.types";
import { Badge } from "@/components/primitives/ui/badge";
import { AgentApprovalCard } from "./agent-approval-card";
import { AgentUnauthorizedNote } from "./agent-unauthorized-note";

interface AgentEmailPartProps {
  state: string;
  input: DeepPartial<AgentEmailInput> | undefined;
  output?: AgentEmailOutput | AgentUnauthorized | AgentToolError;
  approvalId?: string;
}

function EmailResult({ output }: { output: AgentEmailOutput }) {
  return (
    <div className="space-y-1">
      <p>
        {output.sent.length > 0
          ? `Enviado a ${output.sent.join(", ")}`
          : "No se envió ningún correo."}
      </p>
      {output.failed.length > 0 ? (
        <p className="text-destructive">
          Falló: {output.failed.map((f) => f.recipient).join(", ")}
        </p>
      ) : null}
      {output.testInbox ? (
        <p className="text-muted-foreground">
          Entorno de pruebas: el correo se redirigió al buzón de pruebas.
        </p>
      ) : null}
    </div>
  );
}

export function AgentEmailPart({
  state,
  input,
  output,
  approvalId,
}: AgentEmailPartProps) {
  if (isUnauthorized(output))
    return <AgentUnauthorizedNote message={output.message} />;

  const attachments = input?.excelAttachments ?? [];

  return (
    <AgentApprovalCard
      icon={Mail}
      title={input?.subject ?? "Correo"}
      description={
        state === "approval-requested"
          ? "Revisa el correo antes de enviarlo"
          : `Para: ${(input?.to ?? []).join(", ")}`
      }
      state={state}
      approvalId={approvalId}
      approveLabel="Enviar correo"
      result={
        output && !isToolError(output) ? (
          <EmailResult output={output as AgentEmailOutput} />
        ) : (
          <span className="text-destructive">
            {output && "error" in output ? output.error : "No se pudo enviar."}
          </span>
        )
      }
    >
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {(input?.to ?? []).map((recipient) => (
            <Badge key={recipient} variant="secondary" className="text-[11px]">
              {recipient}
            </Badge>
          ))}
        </div>
        <p className="whitespace-pre-wrap text-sm">{input?.body}</p>
        {attachments.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {attachments.map((file, index) => (
              <li key={index} className="flex items-center gap-1.5">
                <FileSpreadsheet className="size-3.5" />
                {file?.fileName?.replace(/\.xlsx$/i, "")}.xlsx
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </AgentApprovalCard>
  );
}
