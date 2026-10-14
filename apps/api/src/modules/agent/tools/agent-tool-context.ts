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

const LONG_URL_MIN_CHARS = 200;

/**
 * Tool results go back into the prompt, so oversize payloads are reduced by
 * shortening arrays (keeping sibling fields like totals intact) before
 * falling back to clipping the raw text.
 */
export function toModelText(value: unknown): { type: 'text'; value: string } {
  const json = JSON.stringify(value) ?? 'null';
  if (json.length <= MODEL_OUTPUT_MAX_CHARS)
    return { type: 'text', value: json };

  for (
    let limit = longestArray(value);
    limit >= 1;
    limit = Math.floor(limit / 2)
  ) {
    const fitted = JSON.stringify(capArrays(value, limit));
    if (fitted.length <= MODEL_OUTPUT_MAX_CHARS) {
      return {
        type: 'text',
        value: `${fitted}\n[respuesta recortada: algunas listas muestran solo los primeros ${limit} elementos; los objetos "_omitidos" indican cuántos faltan. No reportes conteos a partir de listas recortadas: usa los campos de totales o informa que la lista está incompleta.]`,
      };
    }
  }

  return {
    type: 'text',
    value: `${json.slice(0, MODEL_OUTPUT_MAX_CHARS)}… [respuesta truncada: ${json.length} caracteres en total; los datos están incompletos, no reportes conteos a partir de ellos. Usa filtros o paginación para ver el resto]`,
  };
}

/** Drops signed/long URLs, which are useless to the model and dominate payload size. */
export function stripLongUrls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripLongUrls);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => !isLongUrl(v))
        .map(([k, v]) => [k, stripLongUrls(v)]),
    );
  }
  return value;
}

function isLongUrl(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.length >= LONG_URL_MIN_CHARS &&
    /^https?:\/\//.test(value)
  );
}

function longestArray(value: unknown): number {
  if (Array.isArray(value)) {
    return Math.max(value.length, ...value.map(longestArray));
  }
  if (value && typeof value === 'object') {
    return Math.max(0, ...Object.values(value).map(longestArray));
  }
  return 0;
}

function capArrays(value: unknown, limit: number): unknown {
  if (Array.isArray(value)) {
    const items = value.slice(0, limit).map((item) => capArrays(item, limit));
    if (value.length > limit) {
      items.push({ _omitidos: value.length - limit, _total: value.length });
    }
    return items;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, capArrays(v, limit)]),
    );
  }
  return value;
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
