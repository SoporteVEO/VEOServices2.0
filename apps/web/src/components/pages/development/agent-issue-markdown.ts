import type { AgentIssue } from "@/api/development/agent-issues.types";
import { toPrettyJson } from "./agent-issue-code-block";
import { ISSUE_SEVERITY_LABELS, ISSUE_STATUS_LABELS } from "./const";

/** The whole ticket as Markdown, ready to paste into an issue or a coding agent. */
export function buildIssueMarkdown(issue: AgentIssue): string {
  const steps = issue.stepsToReproduce
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");

  return [
    `# ${issue.ticket} · ${issue.title}`,
    `- Estado: ${ISSUE_STATUS_LABELS[issue.status]}`,
    `- Severidad: ${ISSUE_SEVERITY_LABELS[issue.severity]}`,
    `- Reportado: ${issue.createdAt}`,
    "",
    "## Solicitud del usuario",
    `> ${issue.userRequest.replace(/\n/g, "\n> ")}`,
    "",
    "## Qué pasó",
    issue.summary,
    "",
    "## Análisis técnico de Nexo",
    issue.technicalDetails,
    ...(steps ? ["", "## Pasos para reproducir", steps] : []),
    ...(issue.expectedBehavior
      ? ["", "## Comportamiento esperado", issue.expectedBehavior]
      : []),
    "",
    "## Diagnóstico del servidor",
    fence(issue.diagnostics),
    "",
    "## Contexto",
    fence(issue.context),
    ...(issue.resolutionNotes
      ? ["", "## Notas de resolución", issue.resolutionNotes]
      : []),
  ].join("\n");
}

function fence(value: unknown): string {
  return ["```json", toPrettyJson(value), "```"].join("\n");
}
