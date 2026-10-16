"use client";

import type { DeepPartial } from "ai";
import { ChevronRight, DatabaseZap, TriangleAlert } from "lucide-react";
import {
  isToolError,
  isUnauthorized,
  type AgentBriloChangeInput,
  type AgentBriloResult,
  type AgentToolError,
  type AgentUnauthorized,
} from "@/api/agent/agent.types";
import { Alert, AlertDescription, AlertTitle } from "@/components/primitives/ui/alert";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/primitives/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/ui/table";
import { AgentApprovalCard } from "./agent-approval-card";
import { AgentToolStatus } from "./agent-tool-status";
import { AgentUnauthorizedNote } from "./agent-unauthorized-note";

interface AgentBriloChangePartProps {
  state: string;
  input: DeepPartial<AgentBriloChangeInput> | undefined;
  output?: AgentBriloResult | AgentUnauthorized | AgentToolError;
  errorText?: string;
  approvalId?: string;
}

const APPROVAL_STATES = new Set([
  "approval-requested",
  "approval-responded",
  "output-denied",
]);

function toJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function TechnicalDetail({ input }: { input: DeepPartial<AgentBriloChangeInput> }) {
  return (
    <Collapsible className="rounded-md border text-xs">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-2 py-1.5 text-left">
        <Badge variant="outline" className="font-mono text-[11px]">
          {input.method}
        </Badge>
        <span className="min-w-0 truncate font-mono">{input.path}</span>
        <ChevronRight className="ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t px-2 py-2">
        {input.query ? (
          <pre className="overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 font-mono text-[11px]">
            {toJson(input.query)}
          </pre>
        ) : null}
        {input.body !== undefined ? (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 font-mono text-[11px]">
            {toJson(input.body)}
          </pre>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AgentBriloChangePart({
  state,
  input,
  output,
  errorText,
  approvalId,
}: AgentBriloChangePartProps) {
  if (isUnauthorized(output))
    return <AgentUnauthorizedNote message={output.message} />;

  if (!APPROVAL_STATES.has(state) && !approvalId) {
    return (
      <AgentToolStatus
        label="Preparando cambio en Brilo"
        detail={input?.title}
        state={state}
        output={output}
        errorText={errorText ?? (isToolError(output) ? (output.error ?? undefined) : undefined)}
      />
    );
  }

  const isDelete = input?.method === "DELETE";
  const changes = (input?.changes ?? []).filter(
    (change): change is NonNullable<typeof change> => !!change,
  );
  const warnings = (input?.warnings ?? []).filter(Boolean);

  return (
    <AgentApprovalCard
      icon={DatabaseZap}
      title={input?.title ?? "Cambio en Brilo"}
      description={
        state === "approval-requested"
          ? "Brilo ERP · requiere tu confirmación"
          : "Brilo ERP"
      }
      state={state}
      approvalId={approvalId}
      approveLabel={isDelete ? "Eliminar en Brilo" : "Aplicar en Brilo"}
      approveVariant={isDelete ? "destructive" : "default"}
      result={
        output && !isToolError(output) ? (
          <span>Cambio aplicado en Brilo ({output.endpoint}).</span>
        ) : (
          <span className="text-destructive">
            {output && "error" in output && output.error
              ? output.error
              : (errorText ?? "Brilo rechazó el cambio.")}
          </span>
        )
      }
    >
      <div className="space-y-3">
        <Alert variant={isDelete ? "destructive" : "default"}>
          <TriangleAlert className="text-amber-600" />
          <AlertTitle className="text-xs">
            Esto modificará la base de datos de Brilo
          </AlertTitle>
          <AlertDescription className="text-xs">
            Brilo es nuestra fuente de verdad. Revisa cada cambio antes de
            aplicarlo.
          </AlertDescription>
        </Alert>

        {input?.explanation ? (
          <p className="whitespace-pre-line text-sm">{input.explanation}</p>
        ) : null}

        {changes.length > 0 ? (
          <div className="rounded-md border">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8">Registro</TableHead>
                  <TableHead className="h-8">Campo</TableHead>
                  <TableHead className="h-8">Antes</TableHead>
                  <TableHead className="h-8">Después</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((change, index) => (
                  <TableRow key={`${change.record}-${change.field}-${index}`}>
                    <TableCell className="whitespace-normal align-top">
                      {change.record}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {change.field}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words align-top text-muted-foreground">
                      {change.before ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words align-top font-medium">
                      {change.after ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <ul className="space-y-1 text-xs">
            {warnings.map((warning) => (
              <li key={warning} className="flex items-start gap-1.5">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {input?.method ? <TechnicalDetail input={input} /> : null}
      </div>
    </AgentApprovalCard>
  );
}
