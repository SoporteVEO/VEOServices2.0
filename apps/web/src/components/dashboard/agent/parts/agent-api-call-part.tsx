"use client";

import type { DeepPartial } from "ai";
import { ServerCog } from "lucide-react";
import {
  isUnauthorized,
  type AgentCallApiInput,
  type AgentCallApiOutput,
  type AgentUnauthorized,
} from "@/api/agent/agent.types";
import { Badge } from "@/components/primitives/ui/badge";
import { AgentApprovalCard } from "./agent-approval-card";
import { AgentToolStatus } from "./agent-tool-status";
import { AgentUnauthorizedNote } from "./agent-unauthorized-note";

interface AgentApiCallPartProps {
  state: string;
  input: DeepPartial<AgentCallApiInput> | undefined;
  output?: AgentCallApiOutput | AgentUnauthorized;
  errorText?: string;
  approvalId?: string;
}

const APPROVAL_STATES = new Set([
  "approval-requested",
  "approval-responded",
  "output-denied",
]);

export function AgentApiCallPart({
  state,
  input,
  output,
  errorText,
  approvalId,
}: AgentApiCallPartProps) {
  if (isUnauthorized(output))
    return <AgentUnauthorizedNote message={output.message} />;

  const method = input?.method ?? "GET";
  const detail = `${method} ${input?.path ?? ""}`;
  const isWrite = method !== "GET";

  if (!isWrite || !(APPROVAL_STATES.has(state) || approvalId)) {
    return (
      <AgentToolStatus
        label="Consulta al sistema"
        detail={detail}
        state={state}
        input={input?.query ?? input?.body}
        output={output}
        errorText={errorText}
      />
    );
  }

  return (
    <AgentApprovalCard
      icon={ServerCog}
      title="Confirmar cambio en el sistema"
      description="Esta acción modificará datos"
      state={state}
      approvalId={approvalId}
      approveLabel="Confirmar"
      result={
        output?.ok ? (
          <span>Completado ({output.status})</span>
        ) : (
          <span className="text-destructive">
            {output?.error ?? "La operación falló."}
          </span>
        )
      }
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[11px]">
            {method}
          </Badge>
          <span className="truncate font-mono text-xs">{input?.path}</span>
        </div>
        {input?.body ? (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 font-mono text-[11px]">
            {JSON.stringify(input.body, null, 2)}
          </pre>
        ) : null}
      </div>
    </AgentApprovalCard>
  );
}
