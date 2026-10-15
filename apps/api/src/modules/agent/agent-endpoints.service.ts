import { Injectable, OnModuleInit, RequestMethod } from '@nestjs/common';
import {
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { getMetadataStorage } from 'class-validator';
import {
  ALLOW_LIMITED_KEY,
  ALLOWED_FIELD_ROLES_KEY,
  IS_PUBLIC_KEY,
  REQUIRED_ROLES_KEY,
  REQUIRED_SUB_ROLES_KEY,
} from '../auth/decorators.js';
import { FIELD_ROLES } from '../auth/field-roles.js';
import {
  canAccessScope,
  findScopeForPath,
  type AgentScopeKey,
  type AgentUser,
} from './agent-scopes.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface GuardRules {
  isPublic: boolean;
  allowLimited: boolean;
  requiredRoles?: string[];
  requiredSubRoles?: string[];
  allowedFieldRoles?: string[];
}

export interface AgentEndpointField {
  name: string;
  optional: boolean;
}

export interface AgentEndpoint {
  method: HttpMethod;
  path: string;
  handler: string;
  scope: AgentScopeKey;
  pathParams: string[];
  query: AgentEndpointField[];
  body: AgentEndpointField[];
  rules: GuardRules;
  matcher: RegExp;
}

const HTTP_METHODS: Partial<Record<RequestMethod, HttpMethod>> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.DELETE]: 'DELETE',
};

const WEBHOOK_PATH = /\/webhooks?(\/|$)/;

@Injectable()
export class AgentEndpointsService implements OnModuleInit {
  private endpoints: AgentEndpoint[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    this.endpoints = this.discover();
  }

  listFor(user: AgentUser): AgentEndpoint[] {
    return this.endpoints.filter((e) => this.isAllowed(e, user));
  }

  match(method: HttpMethod, path: string): AgentEndpoint | undefined {
    const candidates = this.endpoints.filter(
      (e) => e.method === method && e.matcher.test(path),
    );
    // Literal segments beat `:params`, matching how Express picks the route
    // for `/billboards/states` over `/billboards/:billboardId`.
    return candidates.sort(
      (a, b) => countParams(a.path) - countParams(b.path),
    )[0];
  }

  isAllowed(endpoint: AgentEndpoint, user: AgentUser): boolean {
    const scope = findScopeForPath(endpoint.path);
    if (!scope || !canAccessScope(scope, user)) return false;
    return guardAllows(endpoint.rules, user);
  }

  private discover(): AgentEndpoint[] {
    const result: AgentEndpoint[] = [];
    for (const wrapper of this.discovery.getControllers()) {
      const metatype = wrapper.metatype as (new () => unknown) | undefined;
      const instance = wrapper.instance as Record<string, unknown> | undefined;
      if (!metatype || !instance) continue;

      const controllerPath = normalizePath(
        this.reflector.get<string | string[]>(PATH_METADATA, metatype),
      );
      const prototype = Object.getPrototypeOf(instance) as object;

      for (const methodName of this.scanner.getAllMethodNames(prototype)) {
        const handler = (prototype as Record<string, unknown>)[methodName];
        if (typeof handler !== 'function') continue;
        const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as
          | RequestMethod
          | undefined;
        const method =
          requestMethod != null ? HTTP_METHODS[requestMethod] : undefined;
        if (!method) continue;

        const methodPath = normalizePath(
          Reflect.getMetadata(PATH_METADATA, handler) as string | string[],
        );
        const path = joinPaths(controllerPath, methodPath);
        const scope = findScopeForPath(path);
        if (!scope || WEBHOOK_PATH.test(path)) continue;

        const { query, body } = this.readArgs(metatype, methodName);
        result.push({
          method,
          path,
          handler: methodName,
          scope: scope.key,
          pathParams: [...path.matchAll(/:(\w+)/g)].map((m) => m[1]),
          query,
          body,
          rules: this.readRules(handler as () => unknown, metatype),
          matcher: toMatcher(path),
        });
      }
    }
    return result;
  }

  private readRules(handler: () => unknown, metatype: object): GuardRules {
    const targets = [handler, metatype as () => unknown];
    return {
      isPublic:
        this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets) ??
        false,
      allowLimited:
        this.reflector.getAllAndOverride<boolean>(ALLOW_LIMITED_KEY, targets) ??
        false,
      requiredRoles: this.reflector.getAllAndOverride<string[]>(
        REQUIRED_ROLES_KEY,
        targets,
      ),
      requiredSubRoles: this.reflector.getAllAndOverride<string[]>(
        REQUIRED_SUB_ROLES_KEY,
        targets,
      ),
      allowedFieldRoles: this.reflector.getAllAndOverride<string[]>(
        ALLOWED_FIELD_ROLES_KEY,
        targets,
      ),
    };
  }

  private readArgs(
    metatype: object,
    methodName: string,
  ): { query: AgentEndpointField[]; body: AgentEndpointField[] } {
    const args = (Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      metatype,
      methodName,
    ) ?? {}) as Record<string, { index: number; data?: unknown }>;
    const paramTypes = (Reflect.getMetadata(
      'design:paramtypes',
      (metatype as { prototype: object }).prototype,
      methodName,
    ) ?? []) as unknown[];

    const query: AgentEndpointField[] = [];
    const body: AgentEndpointField[] = [];

    for (const [key, arg] of Object.entries(args)) {
      const type = Number(key.split(':')[0]);
      const target =
        type === Number(RouteParamtypes.QUERY)
          ? query
          : type === Number(RouteParamtypes.BODY)
            ? body
            : null;
      if (!target) continue;

      if (typeof arg.data === 'string') {
        target.push({ name: arg.data, optional: true });
        continue;
      }
      target.push(...dtoFields(paramTypes[arg.index]));
    }
    return { query, body };
  }
}

function dtoFields(dto: unknown): AgentEndpointField[] {
  if (typeof dto !== 'function') return [];
  const metas = getMetadataStorage().getTargetValidationMetadatas(
    dto,
    '',
    true,
    false,
  );
  const fields = new Map<string, AgentEndpointField>();
  for (const meta of metas) {
    const current = fields.get(meta.propertyName) ?? {
      name: meta.propertyName,
      optional: false,
    };
    if (meta.type === 'conditionalValidation') current.optional = true;
    fields.set(meta.propertyName, current);
  }
  return [...fields.values()];
}

/** Same decision tree as `AuthGuard`, evaluated ahead of the request. */
function guardAllows(rules: GuardRules, user: AgentUser): boolean {
  if (rules.isPublic) return true;
  if (user.role === 'LIMITED' && !rules.allowLimited) return false;

  const matchesRole = Boolean(rules.requiredRoles?.includes(user.role));
  const matchesSubRole = Boolean(
    rules.requiredSubRoles?.some((sr) => user.subRoles.includes(sr)),
  );
  const isGranted = matchesRole || matchesSubRole;

  if (FIELD_ROLES.has(user.role) && !isGranted) {
    if (!rules.allowedFieldRoles?.includes(user.role)) return false;
  }
  if (
    (rules.requiredRoles?.length || rules.requiredSubRoles?.length) &&
    !isGranted
  ) {
    return false;
  }
  return true;
}

function normalizePath(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value === '/') return '';
  return `/${value.replace(/^\/+|\/+$/g, '')}`;
}

function joinPaths(a: string, b: string): string {
  return `${a}${b}` || '/';
}

function toMatcher(path: string): RegExp {
  const pattern = path
    .split('/')
    .map((segment) =>
      segment.startsWith(':')
        ? '[^/]+'
        : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    .join('/');
  return new RegExp(`^${pattern}$`);
}

function countParams(path: string): number {
  return (path.match(/:/g) ?? []).length;
}
