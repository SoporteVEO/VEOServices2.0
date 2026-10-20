import { BRILO_ENDPOINTS, BRILO_MODELS } from './brilo-webapi-catalog.data.js';
import type {
  BriloEndpointDoc,
  BriloHttpMethod,
} from './brilo-webapi-catalog.types.js';

export type { BriloEndpointDoc, BriloHttpMethod };

/** Credential flows, upload plumbing and binary downloads are never exposed. */
const BLOCKED_PATHS = new Set([
  '/api/Seguridad/Login',
  '/api/Seguridad/CambioPassword',
  '/api/v2/McpUploads/{uploadId}',
  '/api/Comun/GetFile',
  '/api/v2/Ventas/ODF/{mfaId}/Pdf',
]);

/** Payroll and ERP user administration stay admin-only even for reads. */
export const BRILO_ADMIN_ONLY_MODULES = new Set(['Nomina', 'Seguridad']);

const SAFE_PATH = /^\/[\w\-./%@:]*$/;

interface CompiledEndpoint {
  doc: BriloEndpointDoc;
  pattern: RegExp;
  paramNames: string[];
  literalSegments: number;
}

const COMPILED: CompiledEndpoint[] = BRILO_ENDPOINTS.filter(
  (doc) => !BLOCKED_PATHS.has(doc.path),
).map((doc) => {
  const paramNames: string[] = [];
  const segments = doc.path.split('/').filter(Boolean);
  const source = segments
    .map((segment) => {
      const param = /^\{(\w+)\}$/.exec(segment);
      if (param) {
        paramNames.push(param[1]);
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return {
    doc,
    pattern: new RegExp(`^/${source}$`, 'i'),
    paramNames,
    literalSegments: segments.length - paramNames.length,
  };
});

const MODELS_BY_LOWER = new Map(
  Object.keys(BRILO_MODELS).map((name) => [name.toLowerCase(), name]),
);

export function listBriloEndpoints(): BriloEndpointDoc[] {
  return COMPILED.map((c) => c.doc);
}

export function listBriloModules(): string[] {
  return [...new Set(COMPILED.map((c) => c.doc.module))];
}

/**
 * Accepts paths with or without the `/api` prefix and drops any query string.
 * Returns null for anything that could escape the API root.
 */
export function normalizeBriloPath(raw: string): string | null {
  const withoutQuery = raw.split('?')[0]?.trim() ?? '';
  const withSlash = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`;
  const path = /^\/api(\/|$)/i.test(withSlash) ? withSlash : `/api${withSlash}`;
  if (!SAFE_PATH.test(path) || path.includes('..')) return null;
  return path.replace(/\/+$/, '');
}

/** Path relative to BRILO_WEBAPI_URL, which already ends in `/api`. */
export function toBriloServicePath(path: string): string {
  return path.replace(/^\/api/i, '') || '/';
}

export interface BriloEndpointMatch {
  doc: BriloEndpointDoc;
  pathParams: Record<string, string>;
}

/** The most specific template wins, so `/ODF/ByGuid/{g}` beats `/ODF/{id}/{x}`. */
export function matchBriloEndpoint(
  method: BriloHttpMethod,
  path: string,
): BriloEndpointMatch | null {
  let best: { compiled: CompiledEndpoint; values: string[] } | null = null;
  for (const compiled of COMPILED) {
    if (compiled.doc.method !== method) continue;
    const match = compiled.pattern.exec(path);
    if (!match) continue;
    if (!best || compiled.literalSegments > best.compiled.literalSegments) {
      best = { compiled, values: match.slice(1) };
    }
  }
  if (!best) return null;
  return {
    doc: best.compiled.doc,
    pathParams: Object.fromEntries(
      best.compiled.paramNames.map((name, i) => [
        name,
        decodeURIComponent(best.values[i]),
      ]),
    ),
  };
}

export function findBriloEndpoint(ref: string): BriloEndpointDoc | undefined {
  const trimmed = ref.trim();
  const byId = COMPILED.find(
    (c) => c.doc.id.toLowerCase() === trimmed.toLowerCase(),
  );
  if (byId) return byId.doc;

  const [maybeMethod, ...rest] = trimmed.split(/\s+/);
  const method = maybeMethod?.toUpperCase() as BriloHttpMethod;
  const rawPath = rest.join('');
  if (!rawPath) return undefined;
  const path = normalizeBriloPath(rawPath);
  if (!path) return undefined;
  return (
    COMPILED.find(
      (c) =>
        c.doc.method === method &&
        c.doc.path.toLowerCase() === path.toLowerCase(),
    )?.doc ?? matchBriloEndpoint(method, path)?.doc
  );
}

export function getBriloModel(
  name: string,
): { name: string; fields: readonly string[] } | undefined {
  const bare = name.replace(/^(array|list of)\s*/i, '').replace(/[[\]]/g, '');
  const key = MODELS_BY_LOWER.get(bare.toLowerCase());
  return key ? { name: key, fields: BRILO_MODELS[key] } : undefined;
}

/** Names of the models a model's fields refer to (e.g. `List of[detX]`). */
export function nestedBriloModels(fields: readonly string[]): string[] {
  const names = new Set<string>();
  for (const field of fields) {
    for (const match of field.matchAll(/\[(\w+)\]/g)) {
      const model = getBriloModel(match[1]);
      if (model) names.add(model.name);
    }
  }
  return [...names];
}
