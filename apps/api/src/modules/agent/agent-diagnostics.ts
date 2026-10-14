import type { UIMessage } from 'ai' with { 'resolution-mode': 'import' };
import { limitPayload } from './tools/agent-tool-context.js';

const MAX_ENTRIES = 40;
const MAX_TEXT_CHARS = 4_000;
const MAX_JSON_CHARS = 6_000;
const CONVERSATION_MESSAGES = 12;

export interface AgentErrorDetails {
  name: string;
  message: string;
  stack?: string;
  cause?: string;
  statusCode?: number;
}

export interface AgentToolExecution {
  at: string;
  tool: string;
  toolCallId: string;
  durationMs: number;
  input: unknown;
  outcome: 'ok' | 'error';
  output?: unknown;
  error?: AgentErrorDetails;
}

export interface AgentApiFailure {
  at: string;
  method: string;
  url: string;
  status: number;
  error: string;
  response?: unknown;
  exception?: AgentErrorDetails;
}

/**
 * Everything that happened server-side during one chat request, so a ticket
 * carries the real inputs, errors and stack traces rather than the model's
 * paraphrase of them.
 */
export class AgentDiagnostics {
  readonly startedAt = new Date().toISOString();
  private readonly toolExecutions: AgentToolExecution[] = [];
  private readonly apiFailures: AgentApiFailure[] = [];

  recordToolExecution(entry: Omit<AgentToolExecution, 'at'>): void {
    push(this.toolExecutions, {
      at: new Date().toISOString(),
      ...entry,
      input: clip(entry.input),
      output: entry.output === undefined ? undefined : clip(entry.output),
    });
  }

  recordApiFailure(entry: Omit<AgentApiFailure, 'at'>): void {
    push(this.apiFailures, {
      at: new Date().toISOString(),
      ...entry,
      response: entry.response === undefined ? undefined : clip(entry.response),
    });
  }

  snapshot() {
    return {
      requestStartedAt: this.startedAt,
      failedToolCalls: this.toolExecutions.filter((e) => e.outcome === 'error')
        .length,
      toolExecutions: this.toolExecutions,
      apiFailures: this.apiFailures,
    };
  }
}

export function describeError(error: unknown): AgentErrorDetails {
  if (error instanceof Error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    return {
      name: error.name,
      message: truncate(error.message),
      stack: error.stack ? truncate(error.stack) : undefined,
      cause: error.cause ? truncate(describeCause(error.cause)) : undefined,
      statusCode: typeof statusCode === 'number' ? statusCode : undefined,
    };
  }
  return { name: typeof error, message: truncate(String(error)) };
}

/** The last turns of the conversation, trimmed for storage in a ticket. */
export function summarizeConversation(messages: UIMessage[]) {
  return messages.slice(-CONVERSATION_MESSAGES).map((message) => ({
    id: message.id,
    role: message.role,
    parts: message.parts
      .filter((part) => part.type !== 'step-start')
      .map((part) => clip(part)),
  }));
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) {
    const code = (cause as { code?: unknown }).code;
    return [cause.name, typeof code === 'string' ? code : null, cause.message]
      .filter(Boolean)
      .join(': ');
  }
  return JSON.stringify(cause) ?? typeof cause;
}

function push<T>(list: T[], entry: T): void {
  if (list.length < MAX_ENTRIES) list.push(entry);
}

function truncate(text: string): string {
  return text.length <= MAX_TEXT_CHARS
    ? text
    : `${text.slice(0, MAX_TEXT_CHARS)}… [${text.length} caracteres]`;
}

function clip(value: unknown): unknown {
  const limited = limitPayload(value);
  const json = JSON.stringify(limited) ?? 'null';
  if (json.length <= MAX_JSON_CHARS) return limited;
  return { _truncated: `${json.slice(0, MAX_JSON_CHARS)}…`, size: json.length };
}
