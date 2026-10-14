import { format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  AgentIssueSeverity,
  AgentIssueStatus,
  AgentIssueUser,
} from "@/api/development/agent-issues.types";

export const AGENT_ISSUES_DEFAULT_PAGE_SIZE = 25;
export const AGENT_ISSUES_SEARCH_PLACEHOLDER =
  "Buscar por ticket (NX-0001), título o solicitud...";

export const ISSUE_STATUS_ORDER: AgentIssueStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "DISMISSED",
];

export const ISSUE_STATUS_LABELS: Record<AgentIssueStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En proceso",
  RESOLVED: "Resuelto",
  DISMISSED: "Descartado",
};

export const ISSUE_STATUS_TAB_LABELS: Record<AgentIssueStatus, string> = {
  OPEN: "Abiertos",
  IN_PROGRESS: "En proceso",
  RESOLVED: "Resueltos",
  DISMISSED: "Descartados",
};

export const ISSUE_STATUS_STYLES: Record<AgentIssueStatus, string> = {
  OPEN: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  IN_PROGRESS:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  RESOLVED:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  DISMISSED:
    "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export const ISSUE_SEVERITY_ORDER: AgentIssueSeverity[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

export const ISSUE_SEVERITY_LABELS: Record<AgentIssueSeverity, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

export const ISSUE_SEVERITY_STYLES: Record<AgentIssueSeverity, string> = {
  CRITICAL: "border-red-500/60 bg-red-500/15 text-red-700 dark:text-red-400",
  HIGH: "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  MEDIUM:
    "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  LOW: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export function formatIssueDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

export function issueUserName(user: AgentIssueUser | null): string {
  if (!user) return "Usuario eliminado";
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}
