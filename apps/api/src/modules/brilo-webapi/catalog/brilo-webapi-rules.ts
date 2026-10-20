const RULES_REL = 'https://briloerp.com/rels/business-rules';
const METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

type JsonRecord = Record<string, unknown>;

export interface BriloRuleRoute {
  method?: string;
  path: string;
}

export interface BriloEndpointRules {
  routes: BriloRuleRoute[];
  rules: JsonRecord;
}

/**
 * Business rules Brilo publishes per module at
 * `/.well-known/api-catalog/rules/{Module}` (RFC 9727 linkset).
 */
export interface BriloModuleRules {
  name: string;
  summary: string | null;
  authModel: unknown;
  crossCuttingRules: string[];
  notes: string[];
  endpoints: BriloEndpointRules[];
}

export interface BriloRulesMatch {
  module: string;
  matchedRoute: string;
  sameVersion: boolean;
  rules: JsonRecord;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/** Hrefs of the per-module rule documents listed in the api-catalog linkset. */
export function extractRulesLinks(linkset: unknown): string[] {
  if (!isRecord(linkset) || !Array.isArray(linkset.linkset)) return [];
  const hrefs = new Set<string>();
  for (const entry of linkset.linkset) {
    const links = isRecord(entry) ? entry[RULES_REL] : undefined;
    if (!Array.isArray(links)) continue;
    for (const link of links) {
      if (isRecord(link) && typeof link.href === 'string') hrefs.add(link.href);
    }
  }
  return [...hrefs];
}

/**
 * Routes come as "GET /api/x", "GET GET /api/x", "GET /a,/b", "api/x" or an
 * array of those; a method applies to the paths that follow it.
 */
export function parseRoutes(routes: unknown): BriloRuleRoute[] {
  const sources = Array.isArray(routes) ? routes : [routes];
  const parsed: BriloRuleRoute[] = [];
  for (const source of sources) {
    if (typeof source !== 'string') continue;
    let method: string | undefined;
    for (const token of source.split(/[\s,]+/).filter(Boolean)) {
      const upper = token.toUpperCase();
      if (METHODS.has(upper)) method = upper;
      else if (token.includes('/')) parsed.push({ method, path: token });
    }
  }
  return parsed;
}

function parseEndpoints(raw: JsonRecord): BriloEndpointRules[] {
  const toList = (value: unknown): unknown[] =>
    Array.isArray(value) ? (value as unknown[]) : [value];
  const entries = [
    ...toList(raw.endpoints),
    ...(Array.isArray(raw.additionalEndpoints)
      ? toList(raw.additionalEndpoints)
      : []),
  ].filter(isRecord);

  return entries.map((entry) => {
    const verb =
      typeof entry.verb === 'string' ? entry.verb.toUpperCase() : undefined;
    const singleVerb = verb && METHODS.has(verb) ? verb : undefined;
    const routes = parseRoutes(entry.routes).map((route) => ({
      ...route,
      method: route.method ?? singleVerb,
    }));
    return { routes, rules: entry };
  });
}

export function parseModuleRules(name: string, raw: unknown): BriloModuleRules {
  const source = isRecord(raw) ? raw : {};
  return {
    name,
    summary: typeof source.summary === 'string' ? source.summary : null,
    authModel: source.authModel ?? null,
    crossCuttingRules: toStrings(source.crossCuttingRules),
    notes: toStrings(source.notes),
    endpoints: parseEndpoints(source),
  };
}

function comparable(path: string, keepVersion: boolean): string {
  const bare = path
    .split('?')[0]
    .toLowerCase()
    .replace(/^\/?api(\/|$)/, '')
    .replace(/\{[^}]*\}/g, '{}')
    .replace(/\/+$/, '');
  return keepVersion ? bare : bare.replace(/^v\d+\//, '');
}

/**
 * Rules documented for the exact route win; otherwise the same route under
 * another API version (rules are often written once for the oldest one).
 */
export function findRulesForEndpoint(
  modules: readonly BriloModuleRules[],
  method: string,
  path: string,
): BriloRulesMatch[] {
  const matches: BriloRulesMatch[] = [];
  for (const keepVersion of [true, false]) {
    const target = comparable(path, keepVersion);
    for (const module of modules) {
      for (const endpoint of module.endpoints) {
        const route = endpoint.routes.find(
          (candidate) =>
            candidate.method?.toUpperCase() === method.toUpperCase() &&
            comparable(candidate.path, keepVersion) === target,
        );
        if (!route) continue;
        matches.push({
          module: module.name,
          matchedRoute: `${route.method} ${route.path}`,
          sameVersion: keepVersion,
          rules: endpoint.rules,
        });
      }
    }
    if (matches.length > 0) break;
  }
  return matches;
}

export function findModuleRules(
  modules: readonly BriloModuleRules[],
  name: string,
): BriloModuleRules[] {
  const wanted = name.trim().toLowerCase();
  if (!wanted) return [];
  return modules.filter((module) =>
    module.name.toLowerCase().startsWith(wanted),
  );
}
