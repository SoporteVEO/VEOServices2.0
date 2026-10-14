import type { AgentToolContext } from './agent-tool-context.js';
import { buildApiTools } from './api.tools.js';
import { buildBillboardTools } from './billboards.tools.js';
import { buildDataSourceTools } from './data-source.tools.js';
import { buildDocumentTools } from './documents.tools.js';
import { buildEmailTools } from './email.tools.js';
import { buildIssueTools } from './issues.tools.js';
import { buildLearningTools } from './learnings.tools.js';
import { buildReportTools } from './reports.tools.js';
import { buildSalesTools } from './sales.tools.js';

export function buildAgentTools(ctx: AgentToolContext) {
  return {
    ...buildApiTools(ctx),
    ...buildBillboardTools(ctx),
    ...buildReportTools(ctx),
    ...buildSalesTools(ctx),
    ...buildDocumentTools(),
    ...buildEmailTools(ctx),
    ...buildIssueTools(ctx),
    ...buildLearningTools(ctx),
    ...buildDataSourceTools(),
  };
}

export type AgentTools = ReturnType<typeof buildAgentTools>;

export { loadBriloMcpTools } from './brilo-mcp.tools.js';
export type {
  AgentIssueReport,
  AgentToolContext,
} from './agent-tool-context.js';
