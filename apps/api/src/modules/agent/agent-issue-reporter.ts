import type { Prisma } from '@prisma/client';
import type { Request } from 'express';
import type { UIMessage } from 'ai' with { 'resolution-mode': 'import' };
import type { AgentIssuesService } from '../development/agent-issues.service.js';
import {
  type AgentDiagnostics,
  summarizeConversation,
} from './agent-diagnostics.js';
import { type AgentUser, partitionScopes } from './agent-scopes.js';
import type { AgentIssueReport } from './tools/index.js';

interface IssueReporterOptions {
  issues: AgentIssuesService;
  diagnostics: AgentDiagnostics;
  user: AgentUser;
  req: Request;
  threadId: string;
  messageId: string;
  model: string;
  conversation: UIMessage[];
}

/**
 * Files at most one ticket per chat request: a model retrying the report in a
 * later step gets the ticket it already opened.
 */
export function createIssueReporter(options: IssueReporterOptions) {
  let filed: Promise<{ ticket: string }> | undefined;

  return (report: AgentIssueReport): Promise<{ ticket: string }> => {
    filed ??= file(options, report).catch((error: unknown) => {
      filed = undefined;
      throw error;
    });
    return filed;
  };
}

async function file(
  {
    issues,
    diagnostics,
    user,
    req,
    threadId,
    messageId,
    model,
    conversation,
  }: IssueReporterOptions,
  report: AgentIssueReport,
) {
  const { allowed } = partitionScopes(user);
  const context = {
    reportedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
    model,
    thread: { id: threadId, messageId },
    user: {
      id: user.id,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
      role: user.role,
      subRoles: user.subRoles,
      allowedScopes: allowed.map((s) => s.key),
    },
    client: {
      origin: req.get('origin') ?? null,
      referer: req.get('referer') ?? null,
      userAgent: req.get('user-agent') ?? null,
    },
  };

  return issues.create({
    ...report,
    diagnostics: toJson({
      ...diagnostics.snapshot(),
      conversation: summarizeConversation(conversation),
    }),
    context: toJson(context),
    threadId,
    reporterId: user.id,
  });
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
