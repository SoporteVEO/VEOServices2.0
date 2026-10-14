import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import type { HttpMethod } from '../agent-endpoints.service.js';
import {
  type AgentToolContext,
  limitPayload,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const SAFE_PATH = /^\/[\w\-./:%@]*$/;

const queryValue = z.union([z.string(), z.number(), z.boolean()]);

export function buildApiTools(ctx: AgentToolContext) {
  return {
    list_api_endpoints: defineTool({
      description:
        'Lists the VEO backend endpoints the user can access, with their query and body parameters. Use it before call_api when you do not know the exact path.',
      inputSchema: z.object({
        scope: z
          .string()
          .optional()
          .describe('Module key (e.g. "static_billboards").'),
        search: z
          .string()
          .optional()
          .describe('Text to search in the path or handler name.'),
      }),
      execute: ({ scope, search }) => {
        const term = search?.toLowerCase().trim();
        const endpoints = ctx.endpoints
          .listFor(ctx.user)
          .filter((e) => !scope || e.scope === scope)
          .filter(
            (e) =>
              !term ||
              e.path.toLowerCase().includes(term) ||
              e.handler.toLowerCase().includes(term),
          )
          .map((e) => ({
            method: e.method,
            path: e.path,
            handler: e.handler,
            scope: e.scope,
            query: e.query.map((f) => (f.optional ? `${f.name}?` : f.name)),
            body: e.body.map((f) => (f.optional ? `${f.name}?` : f.name)),
          }));
        return { count: endpoints.length, endpoints };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),

    call_api: defineTool({
      description:
        'Calls a VEO backend endpoint on behalf of the user, with all existing logic and validations. Paths have no /api/v1 prefix. Write operations (POST, PUT, PATCH, DELETE) require user confirmation.',
      inputSchema: z.object({
        method: z.enum(HTTP_METHODS),
        path: z
          .string()
          .describe('Concrete path, e.g. /billboards/123/contracts'),
        query: z.record(z.string(), queryValue).optional(),
        body: z.record(z.string(), z.unknown()).optional(),
      }),
      execute: async ({ method, path, query, body }) => {
        const pathname = normalizeAgentPath(path);
        if (!pathname) {
          return { ok: false, error: 'Ruta inválida' };
        }

        const endpoint = ctx.endpoints.match(method as HttpMethod, pathname);
        if (!endpoint) {
          return {
            ok: false,
            error: `No existe ${method} ${pathname} o no está disponible para el asistente. Consulta list_api_endpoints.`,
          };
        }
        if (!ctx.endpoints.isAllowed(endpoint, ctx.user)) {
          return unauthorized(endpoint.scope);
        }

        const response = await ctx.api.request({
          method: method as HttpMethod,
          path: pathname,
          query,
          body,
        });
        if (response.status === 401 || response.status === 403) {
          return unauthorized(endpoint.scope);
        }
        return {
          ok: response.ok,
          status: response.status,
          endpoint: `${endpoint.method} ${endpoint.path}`,
          data: limitPayload(response.data),
          error: response.error,
        };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),
  };
}

function normalizeAgentPath(raw: string): string | null {
  const withoutQuery = raw.split('?')[0]?.trim() ?? '';
  const withoutPrefix = withoutQuery.replace(/^\/?api\/v\d+/, '');
  const path = withoutPrefix.startsWith('/')
    ? withoutPrefix
    : `/${withoutPrefix}`;
  if (!SAFE_PATH.test(path) || path.includes('..')) return null;
  return path.replace(/\/+$/, '') || '/';
}
