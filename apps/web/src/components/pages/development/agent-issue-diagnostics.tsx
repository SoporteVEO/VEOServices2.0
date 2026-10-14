"use client";

import { ChevronRight } from "lucide-react";
import type {
  AgentIssueApiFailure,
  AgentIssueDiagnostics,
  AgentIssueErrorDetails,
  AgentIssueToolExecution,
} from "@/api/development/agent-issues.types";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/primitives/ui/collapsible";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./agent-issue-code-block";
import { formatIssueDateTime } from "./const";

export function AgentIssueDiagnosticsView({
  diagnostics,
}: {
  diagnostics: AgentIssueDiagnostics;
}) {
  const executions = diagnostics.toolExecutions ?? [];
  const apiFailures = diagnostics.apiFailures ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Llamadas a herramientas"
        hint={`${executions.length} en la solicitud, ${diagnostics.failedToolCalls ?? 0} con error`}
      >
        {executions.length === 0 ? (
          <Empty>Nexo no ejecutó herramientas antes de reportar.</Empty>
        ) : (
          executions.map((execution) => (
            <ToolExecutionItem
              key={execution.toolCallId}
              execution={execution}
            />
          ))
        )}
      </Section>

      <Section
        title="Solicitudes HTTP fallidas"
        hint="Llamadas internas al backend que respondieron con error"
      >
        {apiFailures.length === 0 ? (
          <Empty>Ninguna.</Empty>
        ) : (
          apiFailures.map((failure, index) => (
            <ApiFailureItem key={index} failure={failure} />
          ))
        )}
      </Section>
    </div>
  );
}

function ToolExecutionItem({
  execution,
}: {
  execution: AgentIssueToolExecution;
}) {
  const failed = execution.outcome === "error";
  return (
    <Collapsible defaultOpen={failed} className="rounded-lg border bg-card">
      <ItemTrigger>
        <span className="font-mono text-xs font-semibold">
          {execution.tool}
        </span>
        <OutcomeBadge failed={failed} />
        <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
          {execution.durationMs} ms · {formatIssueDateTime(execution.at)}
        </span>
      </ItemTrigger>
      <CollapsibleContent className="flex flex-col gap-2 border-t p-3">
        <CodeBlock label="Entrada" value={execution.input} />
        {execution.error ? <ErrorDetails error={execution.error} /> : null}
        <CodeBlock label="Salida" value={execution.output} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function ApiFailureItem({ failure }: { failure: AgentIssueApiFailure }) {
  return (
    <Collapsible defaultOpen className="rounded-lg border bg-card">
      <ItemTrigger>
        <Badge variant="outline" className="font-mono text-[10px]">
          {failure.method}
        </Badge>
        <span className="min-w-0 truncate font-mono text-xs">
          {failure.url}
        </span>
        <Badge
          variant="outline"
          className="ml-auto shrink-0 border-red-500/50 bg-red-500/10 font-mono text-[10px] text-red-700 dark:text-red-400"
        >
          {failure.status === 0 ? "sin respuesta" : failure.status}
        </Badge>
      </ItemTrigger>
      <CollapsibleContent className="flex flex-col gap-2 border-t p-3">
        <CodeBlock label="Error" value={failure.error} />
        {failure.exception ? <ErrorDetails error={failure.exception} /> : null}
        <CodeBlock label="Respuesta" value={failure.response} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function ErrorDetails({ error }: { error: AgentIssueErrorDetails }) {
  const heading = [
    error.name,
    error.statusCode ? `HTTP ${error.statusCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex flex-col gap-2 rounded-md border border-red-500/40 bg-red-500/5 p-2.5">
      <p className="text-xs">
        <span className="font-semibold text-red-700 dark:text-red-400">
          {heading}:
        </span>{" "}
        {error.message}
      </p>
      <CodeBlock label="Causa" value={error.cause} />
      <CodeBlock label="Stack trace" value={error.stack} />
    </div>
  );
}

function ItemTrigger({ children }: { children: React.ReactNode }) {
  return (
    <CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left">
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
      {children}
    </CollapsibleTrigger>
  );
}

function OutcomeBadge({ failed }: { failed: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px]",
        failed
          ? "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
          : "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      )}
    >
      {failed ? "Error" : "OK"}
    </Badge>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
      {children}
    </p>
  );
}
