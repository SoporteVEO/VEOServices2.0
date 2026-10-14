import type { Request } from 'express';
import { type AgentDiagnostics, describeError } from './agent-diagnostics.js';
import type { HttpMethod } from './agent-endpoints.service.js';

export interface AgentApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

interface AgentApiRequest {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

/**
 * Calls this same API on behalf of the user who is chatting, forwarding their
 * credentials. Going through HTTP instead of calling services directly keeps
 * every guard, pipe and validation the dashboard relies on in the loop.
 */
export class AgentApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly headers: Record<string, string>,
    private readonly diagnostics?: AgentDiagnostics,
  ) {}

  static fromRequest(
    req: Request,
    diagnostics?: AgentDiagnostics,
  ): AgentApiClient {
    const configured = process.env.AGENT_INTERNAL_API_URL?.replace(/\/+$/, '');
    const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0];
    const protocol = forwardedProto ?? req.protocol;
    const baseUrl = configured || `${protocol}://${req.get('host')}/api/v1`;

    const headers: Record<string, string> = {};
    const authorization = req.get('authorization');
    const cookie = req.get('cookie');
    if (authorization) headers.authorization = authorization;
    if (cookie) headers.cookie = cookie;

    return new AgentApiClient(baseUrl, headers, diagnostics);
  }

  async request<T = unknown>(
    options: AgentApiRequest,
  ): Promise<AgentApiResponse<T>> {
    const target = `${this.baseUrl}${options.path}`;
    try {
      return await this.send<T>(options);
    } catch (error) {
      const message = `No se pudo completar ${options.method} ${options.path}: ${describeError(error).message}`;
      this.diagnostics?.recordApiFailure({
        method: options.method,
        url: target,
        status: 0,
        error: message,
        exception: describeError(error),
      });
      return { ok: false, status: 0, data: null, error: message };
    }
  }

  private async send<T>(
    options: AgentApiRequest,
  ): Promise<AgentApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${options.path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value == null || value === '') continue;
      url.searchParams.set(key, String(value));
    }

    const hasBody = options.body !== undefined && options.method !== 'GET';
    const response = await fetch(url, {
      method: options.method,
      headers: {
        ...this.headers,
        accept: 'application/json',
        ...(hasBody ? { 'content-type': 'application/json' } : {}),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });

    const data = await readBody(response);
    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        data: data as T,
        error: null,
      };
    }

    const error = errorMessage(data, response.status);
    this.diagnostics?.recordApiFailure({
      method: options.method,
      url: url.toString(),
      status: response.status,
      error,
      response: data,
    });
    return { ok: false, status: response.status, data: null, error };
  }
}

async function readBody(response: Response): Promise<unknown> {
  const type = response.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    return response.json().catch(() => null);
  }
  if (type.startsWith('text/')) return response.text();
  return { contentType: type, note: 'Respuesta binaria omitida' };
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  if (status === 401 || status === 403) {
    return 'No tienes permisos para este recurso';
  }
  return `La solicitud falló con estado ${status}`;
}
