import { Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  BRILO_ADMIN_ONLY_MODULES,
  type BriloEndpointDoc,
  type BriloEndpointMatch,
  findBriloEndpoint,
  getBriloModel,
  listBriloEndpoints,
  listBriloModules,
  matchBriloEndpoint,
  nestedBriloModels,
  normalizeBriloPath,
  toBriloServicePath,
} from '../../brilo-webapi/catalog/brilo-webapi-catalog.js';
import {
  findModuleRules,
  findRulesForEndpoint,
} from '../../brilo-webapi/catalog/brilo-webapi-rules.js';
import type { BriloMethod } from '../../brilo-webapi/brilo-webapi.service.js';
import { defineTool } from '../agent-sdk.js';
import { hasScope, type AgentUser } from '../agent-scopes.js';
import { normalizeText } from '../agent-text-similarity.js';
import {
  type AgentToolContext,
  type UnauthorizedResult,
  limitPayload,
  stripLongUrls,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';

const logger = new Logger('BriloApiTools');

const WRITE_METHODS = ['POST', 'PUT', 'DELETE'] as const;
const SEARCH_LIMIT = 40;
const NESTED_MODELS_LIMIT = 6;

const queryValue = z.union([z.string(), z.number(), z.boolean()]);

const briloChangeSchema = z.object({
  record: z
    .string()
    .min(1)
    .describe(
      'Brilo record affected, readable and with its identifier, e.g. "Cotización COT0311/26 (mcotId 812)".',
    ),
  field: z
    .string()
    .min(1)
    .describe(
      'Readable Spanish name plus the Brilo field, e.g. "Estado (mcotEstado)". Use "Registro completo" for whole-record creates/deletes.',
    ),
  before: z
    .string()
    .optional()
    .describe('Current value read from Brilo. Required for PUT and DELETE.'),
  after: z
    .string()
    .optional()
    .describe('Value after the change. Required for POST and PUT.'),
});

const briloChangeInputSchema = z.object({
  title: z
    .string()
    .min(5)
    .max(140)
    .describe(
      'Short Spanish title of the action, e.g. "Cambiar estado de la cotización COT0311/26 a Aceptada".',
    ),
  explanation: z
    .string()
    .min(30)
    .max(2000)
    .describe(
      'Plain Spanish explanation for a non-technical user: what will be created/modified/deleted in Brilo, on which records, and why.',
    ),
  changes: z
    .array(briloChangeSchema)
    .min(1)
    .max(80)
    .describe('Every field that will change, one row per field and record.'),
  warnings: z
    .array(z.string())
    .max(8)
    .optional()
    .describe(
      'Side effects and risks in Spanish: irreversible deletes, accounting impact of posting, documents generated, fields a PUT replaces, etc.',
    ),
  method: z.enum(WRITE_METHODS),
  path: z
    .string()
    .describe('Concrete Brilo path, e.g. /api/v2/Ventas/ODF/1234/Finalizar'),
  query: z.record(z.string(), queryValue).optional(),
  body: z
    .unknown()
    .optional()
    .describe('Exact JSON body sent to Brilo, following the endpoint model.'),
});

export type BriloChangeInput = z.infer<typeof briloChangeInputSchema>;

type Resolved =
  | { ok: true; match: BriloEndpointMatch; path: string }
  | { ok: false; error: string }
  | UnauthorizedResult;

function canReadModule(user: AgentUser, doc: BriloEndpointDoc): boolean {
  return user.role === 'ADMIN' || !BRILO_ADMIN_ONLY_MODULES.has(doc.module);
}

function endpointLabel(doc: BriloEndpointDoc): string {
  return `${doc.method} ${doc.path}`;
}

function missingRequiredQuery(
  doc: BriloEndpointDoc,
  query: Record<string, unknown> | undefined,
): string[] {
  return (doc.params ?? [])
    .filter((p) => p.in === 'query' && p.required)
    .filter((p) => query?.[p.name] === undefined || query[p.name] === '')
    .map((p) => p.name);
}

function resolveEndpoint(
  method: BriloEndpointDoc['method'],
  rawPath: string,
): Resolved {
  const path = normalizeBriloPath(rawPath);
  if (!path) return { ok: false, error: 'Ruta de Brilo inválida.' };
  const match = matchBriloEndpoint(method, path);
  if (!match) {
    return {
      ok: false,
      error: `No existe ${method} ${path} en el catálogo de Brilo WebAPI o no está disponible para el asistente. Usa brilo_api_search.`,
    };
  }
  return { ok: true, match, path };
}

function changeRuleError(input: BriloChangeInput): string | null {
  const missing = input.changes.filter((c) =>
    input.method === 'POST'
      ? !c.after
      : input.method === 'DELETE'
        ? !c.before
        : !c.before || !c.after,
  );
  if (missing.length === 0) return null;
  const rule =
    input.method === 'POST'
      ? '"after" (valor que se creará)'
      : input.method === 'DELETE'
        ? '"before" (valor actual que se eliminará)'
        : '"before" (valor actual leído de Brilo) y "after"';
  return `Cada cambio de un ${input.method} debe incluir ${rule}. Falta en: ${missing
    .map((c) => `${c.record} · ${c.field}`)
    .join(
      '; ',
    )}. Consulta el registro actual con brilo_api_get antes de proponer el cambio.`;
}

/**
 * Shared by the approval gate and `execute`, so a request that would be
 * rejected never shows an approval button and nothing unapproved can run.
 */
export function resolveBriloChange(
  user: AgentUser,
  input: BriloChangeInput,
): Resolved {
  if (!hasScope(user, 'erp_api_write')) return unauthorized('erp_api_write');
  const resolved = resolveEndpoint(input.method, input.path);
  if (!resolved.ok) return resolved;

  const { doc } = resolved.match;
  if (doc.body && input.body === undefined) {
    return {
      ok: false,
      error: `${endpointLabel(doc)} requiere un body con el modelo ${doc.body}. Revisa brilo_api_describe.`,
    };
  }
  const missingQuery = missingRequiredQuery(doc, input.query);
  if (missingQuery.length > 0) {
    return {
      ok: false,
      error: `Faltan parámetros requeridos: ${missingQuery.join(', ')}.`,
    };
  }
  const ruleError = changeRuleError(input);
  if (ruleError) return { ok: false, error: ruleError };
  return resolved;
}

function searchEndpoints(
  user: AgentUser,
  filters: { query?: string; module?: string; method?: string },
) {
  const canWrite = hasScope(user, 'erp_api_write');
  const terms = normalizeText(filters.query ?? '')
    .split(' ')
    .filter((t) => t.length > 1);

  return listBriloEndpoints()
    .filter((doc) => canReadModule(user, doc))
    .filter((doc) => canWrite || doc.method === 'GET')
    .filter(
      (doc) =>
        !filters.module ||
        doc.module.toLowerCase() === filters.module.toLowerCase(),
    )
    .filter((doc) => !filters.method || doc.method === filters.method)
    .map((doc) => {
      const haystack = normalizeText(
        `${doc.id} ${doc.path} ${doc.summary} ${doc.body ?? ''}`,
      );
      const score = terms.filter((t) => haystack.includes(t)).length;
      return { doc, score };
    })
    .filter(({ score }) => terms.length === 0 || score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, SEARCH_LIMIT)
    .map(({ doc }) => ({
      endpoint: endpointLabel(doc),
      module: doc.module,
      summary:
        doc.summary.length > 220
          ? `${doc.summary.slice(0, 220)}…`
          : doc.summary,
      ...(doc.body ? { body: doc.body } : {}),
    }));
}

function describeModel(name: string) {
  const model = getBriloModel(name);
  if (!model) return null;
  const nested = nestedBriloModels(model.fields)
    .filter((n) => n !== model.name)
    .slice(0, NESTED_MODELS_LIMIT)
    .map((n) => ({ name: n, fields: getBriloModel(n)?.fields ?? [] }));
  return { name: model.name, fields: model.fields, nested };
}

async function describeModuleRules(ctx: AgentToolContext, name: string) {
  const modules = (await ctx.brilo.getBusinessRules()).filter(
    (m) => ctx.user.role === 'ADMIN' || !BRILO_ADMIN_ONLY_MODULES.has(m.name),
  );
  const found = findModuleRules(modules, name);
  if (found.length === 0) {
    return {
      ok: false as const,
      error:
        modules.length === 0
          ? 'Las reglas de negocio de Brilo no están disponibles ahora; usa la documentación del endpoint.'
          : `No hay reglas publicadas para el módulo ${name}. Módulos con reglas: ${modules.map((m) => m.name).join(', ')}.`,
    };
  }
  return {
    ok: true as const,
    modules: found.map((m) => ({
      name: m.name,
      summary: m.summary,
      crossCuttingRules: m.crossCuttingRules,
      notes: m.notes,
      endpointsWithRules: m.endpoints.flatMap((e) =>
        e.routes.map((r) => `${r.method} ${r.path}`),
      ),
    })),
  };
}

async function callBrilo(
  ctx: AgentToolContext,
  method: BriloMethod,
  path: string,
  options: {
    query?: Record<string, string | number | boolean>;
    body?: unknown;
  },
) {
  try {
    const result = await ctx.brilo.send(
      method,
      toBriloServicePath(path),
      options,
    );
    return { ok: true as const, data: result.data, total: result.total };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function buildBriloApiTools(ctx: AgentToolContext) {
  return {
    brilo_api_search: defineTool({
      description:
        'Searches the Brilo ERP WebAPI catalog (official API, source of truth). Returns endpoints with a short summary. Call with no arguments to list the modules. Use brilo_api_describe before calling an endpoint you have not used in this conversation.',
      inputSchema: z.object({
        query: z
          .string()
          .optional()
          .describe(
            'Words to search in path, summary or model, e.g. "cotizaciones vallas".',
          ),
        module: z
          .string()
          .optional()
          .describe(
            'Brilo module, e.g. Vallas, Ventas, CXC, Comun, Compras, Conta, Servicios.',
          ),
        method: z.enum(['GET', ...WRITE_METHODS]).optional(),
      }),
      execute: ({ query, module, method }) => {
        if (!hasScope(ctx.user, 'erp_api')) return unauthorized('erp_api');
        if (!query && !module && !method) {
          return {
            ok: true as const,
            modules: listBriloModules().filter(
              (m) =>
                ctx.user.role === 'ADMIN' || !BRILO_ADMIN_ONLY_MODULES.has(m),
            ),
          };
        }
        const endpoints = searchEndpoints(ctx.user, { query, module, method });
        return { ok: true as const, count: endpoints.length, endpoints };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),

    brilo_api_describe: defineTool({
      description:
        'Returns the full documentation of a Brilo WebAPI endpoint (summary, parameters, body model fields with types) together with the business rules Brilo publishes live for it (validations, error codes, side effects), or of a model, or the general rules of a module (permissions, pagination, output whitelist, conventions). Pass endpoint as "METHOD /api/path" or the operation id.',
      inputSchema: z.object({
        endpoint: z
          .string()
          .optional()
          .describe(
            'e.g. "POST /api/v2/CXC/AbonoFactura" or "apiVallasCotizacionesPost".',
          ),
        model: z
          .string()
          .optional()
          .describe('Model name, e.g. "maeCotizacionesExtendedModel".'),
        module: z
          .string()
          .optional()
          .describe(
            'Module name, e.g. "Vallas" or "CXC", to read its general rules.',
          ),
      }),
      execute: async ({ endpoint, model, module }) => {
        if (!hasScope(ctx.user, 'erp_api')) return unauthorized('erp_api');
        if (endpoint) {
          const doc = findBriloEndpoint(endpoint);
          if (!doc || !canReadModule(ctx.user, doc)) {
            return {
              ok: false as const,
              error: `No encontré ${endpoint} en el catálogo de Brilo. Usa brilo_api_search.`,
            };
          }
          const rules = findRulesForEndpoint(
            await ctx.brilo.getBusinessRules(),
            doc.method,
            doc.path,
          );
          return {
            ok: true as const,
            endpoint: endpointLabel(doc),
            ...doc,
            ...(doc.body ? { bodyModel: describeModel(doc.body) } : {}),
            ...(rules.length > 0 ? { liveRules: rules } : {}),
          };
        }
        if (model) {
          const described = describeModel(model);
          return described
            ? { ok: true as const, model: described }
            : { ok: false as const, error: `No existe el modelo ${model}.` };
        }
        if (module) return describeModuleRules(ctx, module);
        return {
          ok: false as const,
          error: 'Indica endpoint, model o module.',
        };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),

    brilo_api_get: defineTool({
      description:
        'Reads data from Brilo ERP through a GET endpoint of its WebAPI. Read-only. Paths keep the /api prefix, e.g. /api/Vallas/Cotizaciones. Results are paginated (page, per_page); "total" comes from X-Total-Count when Brilo sends it.',
      inputSchema: z.object({
        path: z
          .string()
          .describe('Concrete path, e.g. /api/v2/Ventas/ODF/1234'),
        query: z.record(z.string(), queryValue).optional(),
      }),
      execute: async ({ path, query }) => {
        if (!hasScope(ctx.user, 'erp_api')) return unauthorized('erp_api');
        if (!ctx.brilo.isConfigured()) {
          return {
            ok: false as const,
            error: 'Brilo WebAPI no está configurado.',
          };
        }
        const resolved = resolveEndpoint('GET', path);
        if (!resolved.ok) return resolved;
        const { doc } = resolved.match;
        if (!canReadModule(ctx.user, doc)) return unauthorized('erp_api');
        const missing = missingRequiredQuery(doc, query);
        if (missing.length > 0) {
          return {
            ok: false as const,
            error: `Faltan parámetros requeridos: ${missing.join(', ')}.`,
          };
        }

        const result = await callBrilo(ctx, 'GET', resolved.path, { query });
        if (!result.ok) {
          return {
            ok: false as const,
            endpoint: endpointLabel(doc),
            error: result.error,
          };
        }
        return {
          ok: true as const,
          endpoint: endpointLabel(doc),
          ...(result.total !== null ? { total: result.total } : {}),
          data: limitPayload(result.data),
        };
      },
      toModelOutput: ({ output }) => toModelText(stripLongUrls(output)),
    }),

    brilo_api_change: defineTool({
      description:
        'Creates, updates or deletes data in Brilo ERP (POST, PUT, DELETE on its WebAPI). Brilo is the source of truth: the user sees your title, explanation and the list of changes in a confirmation card and must approve before anything is sent. Never use it without first reading the current record and the endpoint documentation.',
      inputSchema: briloChangeInputSchema,
      execute: async (input) => {
        const resolved = resolveBriloChange(ctx.user, input);
        if (!resolved.ok) return resolved;
        if (!ctx.brilo.isConfigured()) {
          return {
            ok: false as const,
            error: 'Brilo WebAPI no está configurado.',
          };
        }
        const { doc } = resolved.match;
        const label = endpointLabel(doc);

        logger.log(
          `Brilo change approved by ${ctx.user.email}: ${input.method} ${resolved.path} — ${input.title}`,
        );
        const result = await callBrilo(ctx, input.method, resolved.path, {
          query: input.query,
          body: input.body,
        });
        if (!result.ok) {
          logger.warn(
            `Brilo change failed for ${ctx.user.email}: ${input.method} ${resolved.path} — ${result.error}`,
          );
          return { ok: false as const, endpoint: label, error: result.error };
        }
        return {
          ok: true as const,
          endpoint: label,
          data: limitPayload(result.data),
        };
      },
      toModelOutput: ({ output }) => toModelText(stripLongUrls(output)),
    }),
  };
}
