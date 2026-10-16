import type { AgentToolContext } from './agent-tool-context.js';
import { buildAcademyTools } from './academy.tools.js';
import { buildApiTools } from './api.tools.js';
import { buildBillboardTools } from './billboards.tools.js';
import { buildBriloApiTools } from './brilo-api.tools.js';
import { buildCrmOpportunityTools } from './crm-opportunity.tools.js';
import { buildCrmTools } from './crm.tools.js';
import { buildDataSourceTools } from './data-source.tools.js';
import { buildDocumentTools } from './documents.tools.js';
import { buildEmailTools } from './email.tools.js';
import { buildIssueTools } from './issues.tools.js';
import { buildLearningTools } from './learnings.tools.js';
import { buildProposalTools } from './proposals.tools.js';
import { buildReportTools } from './reports.tools.js';
import { buildSalesTools } from './sales.tools.js';

export function buildAgentTools(ctx: AgentToolContext) {
  return {
    ...buildApiTools(ctx),
    ...buildBillboardTools(ctx),
    ...buildReportTools(ctx),
    ...buildProposalTools(ctx),
    ...buildSalesTools(ctx),
    ...buildCrmTools(ctx),
    ...buildCrmOpportunityTools(ctx),
    ...buildBriloApiTools(ctx),
    ...buildDocumentTools(),
    ...buildEmailTools(ctx),
    ...buildIssueTools(ctx),
    ...buildLearningTools(ctx),
    ...buildDataSourceTools(),
    ...buildAcademyTools(),
  };
}

export type AgentTools = ReturnType<typeof buildAgentTools>;

export { loadBriloMcpTools } from './brilo-mcp.tools.js';
export { resolveBriloChange } from './brilo-api.tools.js';
export type {
  AgentIssueReport,
  AgentToolContext,
} from './agent-tool-context.js';
