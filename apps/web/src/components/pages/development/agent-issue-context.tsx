import type { AgentIssue } from "@/api/development/agent-issues.types";
import { formatIssueDateTime, issueUserName } from "./const";

export function AgentIssueContextView({ issue }: { issue: AgentIssue }) {
  const { context } = issue;
  const rows: [string, React.ReactNode][] = [
    ["Reportado", formatIssueDateTime(context.reportedAt ?? issue.createdAt)],
    ["Entorno", context.environment],
    ["Modelo", context.model],
    ["Conversación", context.thread?.id ?? issue.threadId],
    ["Mensaje", context.thread?.messageId],
    ["Usuario", context.user?.name ?? issueUserName(issue.reporter)],
    ["Correo", context.user?.email ?? issue.reporter?.email],
    ["Rol", context.user?.role],
    ["Sub-roles", context.user?.subRoles.join(", ") || "Ninguno"],
    ["Módulos permitidos", context.user?.allowedScopes.join(", ")],
    ["Página", context.client?.referer],
    ["Navegador", context.client?.userAgent],
    [
      "Resuelto",
      issue.resolvedAt
        ? `${formatIssueDateTime(issue.resolvedAt)} · ${issueUserName(issue.resolvedBy)}`
        : null,
    ],
  ];

  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-lg border bg-card p-3 sm:grid-cols-[160px_1fr]">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="min-w-0 break-all font-mono text-xs">{value}</dd>
          </div>
        ))}
    </dl>
  );
}
