import type { EmailService } from '../../email/email.service.js';
import type { AgentApiClient } from '../agent-api-client.js';
import type { AgentEndpointsService } from '../agent-endpoints.service.js';
import {
  AGENT_SCOPES,
  type AgentScopeKey,
  type AgentUser,
} from '../agent-scopes.js';

export interface AgentIssueReport {
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  userRequest: string;
  technicalDetails: string;
  stepsToReproduce: string[];
  expectedBehavior?: string;
}

export interface AgentToolContext {
  user: AgentUser;
  api: AgentApiClient;
  endpoints: AgentEndpointsService;
  email: EmailService;
  reportIssue: (report: AgentIssueReport) => Promise<{ ticket: string }>;
  rememberLearning: (content: string) => Promise<{ saved: boolean }>;
}

export interface UnauthorizedResult {
  ok: false;
  unauthorized: true;
  message: string;
}

export function unauthorized(scope: AgentScopeKey): UnauthorizedResult {
  const label = AGENT_SCOPES.find((s) => s.key === scope)?.label ?? scope;
  return {
    ok: false,
    unauthorized: true,
    message: `No estás autorizado para acceder a "${label}" con tu rol actual.`,
  };
}

const MODEL_OUTPUT_MAX_CHARS = 24_000;

/** Tool results go back into the prompt, so oversize payloads are clipped. */
export function toModelText(value: unknown): { type: 'text'; value: string } {
  const json = JSON.stringify(value) ?? 'null';
  if (json.length <= MODEL_OUTPUT_MAX_CHARS)
    return { type: 'text', value: json };
  return {
    type: 'text',
    value: `${json.slice(0, MODEL_OUTPUT_MAX_CHARS)}… [respuesta truncada: ${json.length} caracteres en total; usa filtros o paginación para ver el resto]`,
  };
}

const STORED_ARRAY_LIMIT = 300;

/** Keeps the persisted chat history bounded when an endpoint returns a lot. */
export function limitPayload(value: unknown, depth = 0): unknown {
  if (Array.isArray(value)) {
    const items = value
      .slice(0, STORED_ARRAY_LIMIT)
      .map((item) => limitPayload(item, depth + 1));
    if (value.length > STORED_ARRAY_LIMIT) {
      items.push({
        _truncated: `${value.length - STORED_ARRAY_LIMIT} elementos más`,
      });
    }
    return items;
  }
  if (value && typeof value === 'object' && depth < 6) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, limitPayload(v, depth + 1)]),
    );
  }
  return value;
}
