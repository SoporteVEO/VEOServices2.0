import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { UIMessage } from 'ai' with { 'resolution-mode': 'import' };
import { AgentIssuesService } from '../development/agent-issues.service.js';
import { AgentLearningsService } from '../development/agent-learnings.service.js';
import { EmailService } from '../email/email.service.js';
import { AgentApiClient } from './agent-api-client.js';
import {
  assertValidAttachments,
  inlineTextAttachments,
} from './agent-attachments.js';
import { AgentDiagnostics, describeError } from './agent-diagnostics.js';
import { createIssueReporter } from './agent-issue-reporter.js';
import { AgentEndpointsService } from './agent-endpoints.service.js';
import { AgentMemoryService } from './agent-memory.service.js';
import { clipText, lastUserText } from './agent-message-text.js';
import {
  cachedSystemMessage,
  getMissingAgentApiKey,
  loadAgentModel,
} from './agent-model.js';
import { AGENT_SYSTEM_PROMPT, buildUserContext } from './agent-prompt.js';
import { providerErrorReport, toUserError } from './agent-provider-errors.js';
import { assertWithinRateLimit } from './agent-rate-limit.js';
import { loadAgentSdk } from './agent-sdk.js';
import type { AgentUser } from './agent-scopes.js';
import { AgentThreadsService } from './agent-threads.service.js';
import type { AgentChatBody } from './dto/agent-chat.schema.js';
import { buildAgentTools, loadBriloMcpTools } from './tools/index.js';

const MAX_STEPS = Number(process.env.AGENT_MAX_STEPS) || 16;
const MAX_OUTPUT_TOKENS = Number(process.env.AGENT_MAX_OUTPUT_TOKENS) || 8000;
const MAX_LEARNINGS_PER_REQUEST = 3;

export interface AgentMessageMetadata {
  createdAt?: number;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
  };
}

@Injectable()
export class AgentChatService {
  private readonly logger = new Logger(AgentChatService.name);

  constructor(
    private readonly threads: AgentThreadsService,
    private readonly endpoints: AgentEndpointsService,
    private readonly email: EmailService,
    private readonly issues: AgentIssuesService,
    private readonly learnings: AgentLearningsService,
    private readonly memory: AgentMemoryService,
  ) {}

  async stream(
    req: Request,
    res: Response,
    user: AgentUser,
    body: AgentChatBody,
  ): Promise<void> {
    const missingKey = getMissingAgentApiKey();
    if (missingKey) {
      throw new ServiceUnavailableException(
        `Nexo no está configurado todavía (falta ${missingKey}).`,
      );
    }
    assertWithinRateLimit(user.id);

    const [sdk, { model, provider, modelId }] = await Promise.all([
      loadAgentSdk(),
      loadAgentModel(),
    ]);
    const incoming = body.message as unknown as UIMessage;
    assertValidAttachments(incoming);
    const stored = await this.threads.open(user.id, body.id, incoming);
    const history = dropUnansweredSourceQuestions(
      mergeIncoming(stored, incoming),
    );
    const question = lastUserText(history);

    const diagnostics = new AgentDiagnostics();
    const [mcp, memory] = await Promise.all([
      loadBriloMcpTools(sdk, user),
      this.memory.buildContext(user.id, body.id, question),
    ]);
    let learningsSaved = 0;
    const reportIssue = createIssueReporter({
      issues: this.issues,
      diagnostics,
      user,
      req,
      threadId: body.id,
      messageId: incoming.id,
      model: `${provider}/${modelId}`,
      conversation: history,
    });
    const tools = {
      ...buildAgentTools({
        user,
        api: AgentApiClient.fromRequest(req, diagnostics),
        endpoints: this.endpoints,
        email: this.email,
        reportIssue,
        rememberLearning: async (content) => {
          if (learningsSaved >= MAX_LEARNINGS_PER_REQUEST) {
            return { saved: false };
          }
          learningsSaved++;
          await this.learnings.propose({
            content,
            example: clipText(question, 500) || undefined,
            source: 'CONVERSATION',
            threadId: body.id,
            proposedById: user.id,
          });
          return { saved: true };
        },
      }),
      ...mcp.tools,
    };

    let messages: UIMessage[];
    try {
      messages = await sdk.ai.validateUIMessages({ messages: history, tools });
    } catch (error) {
      await mcp.close();
      this.logger.warn(
        `Invalid agent history for ${body.id}: ${String(error)}`,
      );
      throw new BadRequestException(
        'El historial de la conversación no es válido. Inicia una nueva conversación.',
      );
    }
    await this.threads.saveMessages(body.id, messages);

    const result = sdk.ai.streamText({
      model,
      instructions: [
        cachedSystemMessage(provider, AGENT_SYSTEM_PROMPT),
        ...(memory
          ? [
              { role: 'system' as const, content: buildUserContext(user) },
              cachedSystemMessage(provider, memory),
            ]
          : [cachedSystemMessage(provider, buildUserContext(user))]),
      ],
      messages: await sdk.ai.convertToModelMessages(
        inlineTextAttachments(dropPastReasoning(messages)),
        { tools },
      ),
      tools,
      toolApproval: {
        send_email: 'user-approval',
        register_crm_opportunity: 'user-approval',
        call_api: ({ method }) =>
          method === 'GET' ? undefined : 'user-approval',
      },
      experimental_toolApprovalSecret: approvalSecret(),
      stopWhen: sdk.ai.isStepCount(MAX_STEPS),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
      onToolExecutionEnd: ({ toolCall, toolOutput, toolExecutionMs }) => {
        if (toolCall.toolName === 'report_issue') return;
        const failed = toolOutput.type === 'tool-error';
        diagnostics.recordToolExecution({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          durationMs: Math.round(toolExecutionMs),
          input: toolCall.input,
          outcome: failed ? 'error' : 'ok',
          ...(failed
            ? { error: describeError(toolOutput.error) }
            : { output: toolOutput.output }),
        });
      },
      onEnd: () => mcp.close(),
      onError: async ({ error }) => {
        this.logger.error('[agent]', error);
        const report = providerErrorReport(error, {
          question,
          threadId: body.id,
        });
        if (!report) return;
        try {
          await reportIssue(report);
        } catch (reportError) {
          this.logger.error('Failed to file agent provider error', reportError);
        }
      },
    });

    // Keeps the run going when the browser disconnects so the answer is still
    // persisted and shows up when the user reopens the conversation.
    void result.consumeStream();

    const stream = sdk.ai.toUIMessageStream<
      typeof tools,
      UIMessage<AgentMessageMetadata>
    >({
      stream: result.stream,
      tools,
      originalMessages: messages as UIMessage<AgentMessageMetadata>[],
      generateMessageId: sdk.ai.createIdGenerator({ prefix: 'msg', size: 16 }),
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return { createdAt: Date.now(), model: `${provider}/${modelId}` };
        }
        if (part.type === 'finish') {
          return {
            usage: {
              inputTokens: part.totalUsage.inputTokens,
              outputTokens: part.totalUsage.outputTokens,
              cachedInputTokens:
                part.totalUsage.inputTokenDetails?.cacheReadTokens,
            },
          };
        }
        return undefined;
      },
      onEnd: async ({ messages: finalMessages }) => {
        try {
          await this.threads.saveMessages(body.id, finalMessages);
        } catch (error) {
          this.logger.error(`Failed to persist agent thread ${body.id}`, error);
        }
      },
      onError: (error) => {
        this.logger.error('[agent:stream]', error);
        return toUserError(error);
      },
    });

    await sdk.ai.pipeUIMessageStreamToResponse({ response: res, stream });
  }
}

/**
 * A message the server already has is a continuation (tool approvals) or a
 * regeneration, so it replaces that point of the history; anything new is
 * appended. Assistant messages can only update, never be introduced, by the
 * client.
 */
function mergeIncoming(stored: UIMessage[], incoming: UIMessage): UIMessage[] {
  const index = stored.findIndex((m) => m.id === incoming.id);
  if (index >= 0) return [...stored.slice(0, index), incoming];
  if (incoming.role !== 'user') {
    throw new BadRequestException('Mensaje fuera de la conversación');
  }
  return [...stored, incoming];
}

/**
 * A source question the user skipped by typing instead has no tool result,
 * which providers reject, so it is removed from earlier turns.
 */
function dropUnansweredSourceQuestions(messages: UIMessage[]): UIMessage[] {
  return messages.map((message, index) => {
    if (message.role !== 'assistant' || index === messages.length - 1) {
      return message;
    }
    const parts = message.parts.filter(
      (part) =>
        part.type !== 'tool-ask_data_source' ||
        (part as { state?: string }).state === 'output-available',
    );
    return parts.length === message.parts.length
      ? message
      : { ...message, parts };
  });
}

/**
 * Claude signs thinking blocks against the exact conversation they were
 * produced in, and stored history no longer matches byte for byte (jsonb
 * reorders keys). Only the turn in progress needs its reasoning replayed.
 */
function dropPastReasoning(messages: UIMessage[]): UIMessage[] {
  const lastUser = messages.findLastIndex((m) => m.role === 'user');
  return messages.map((message, index) => {
    if (message.role !== 'assistant' || index > lastUser) return message;
    const parts = message.parts.filter((part) => part.type !== 'reasoning');
    return parts.length === message.parts.length
      ? message
      : { ...message, parts };
  });
}

function approvalSecret(): string | undefined {
  return (
    process.env.AGENT_TOOL_APPROVAL_SECRET || process.env.BETTER_AUTH_SECRET
  );
}
