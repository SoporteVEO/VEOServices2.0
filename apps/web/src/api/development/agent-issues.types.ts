export type AgentIssueStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "DISMISSED";

export type AgentIssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AgentIssueUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
};

export type AgentIssueListItem = {
  id: string;
  number: number;
  ticket: string;
  status: AgentIssueStatus;
  severity: AgentIssueSeverity;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reporter: AgentIssueUser | null;
};

export type AgentIssueErrorDetails = {
  name: string;
  message: string;
  stack?: string;
  cause?: string;
  statusCode?: number;
};

export type AgentIssueToolExecution = {
  at: string;
  tool: string;
  toolCallId: string;
  durationMs: number;
  input: unknown;
  outcome: "ok" | "error";
  output?: unknown;
  error?: AgentIssueErrorDetails;
};

export type AgentIssueApiFailure = {
  at: string;
  method: string;
  url: string;
  status: number;
  error: string;
  response?: unknown;
  exception?: AgentIssueErrorDetails;
};

export type AgentIssueDiagnostics = {
  requestStartedAt?: string;
  failedToolCalls?: number;
  toolExecutions?: AgentIssueToolExecution[];
  apiFailures?: AgentIssueApiFailure[];
  conversation?: { id: string; role: string; parts: unknown[] }[];
};

export type AgentIssueContext = {
  reportedAt?: string;
  environment?: string;
  model?: string;
  thread?: { id: string; messageId: string };
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    subRoles: string[];
    allowedScopes: string[];
  };
  client?: {
    origin: string | null;
    referer: string | null;
    userAgent: string | null;
  };
};

export type AgentIssue = AgentIssueListItem & {
  technicalDetails: string;
  userRequest: string;
  stepsToReproduce: string[];
  expectedBehavior: string | null;
  diagnostics: AgentIssueDiagnostics;
  context: AgentIssueContext;
  threadId: string | null;
  resolutionNotes: string | null;
  resolvedBy: AgentIssueUser | null;
};

export type PaginatedAgentIssues = {
  data: AgentIssueListItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<AgentIssueStatus, number>;
};

export type UpdateAgentIssueInput = {
  status?: AgentIssueStatus;
  severity?: AgentIssueSeverity;
  resolutionNotes?: string | null;
};
