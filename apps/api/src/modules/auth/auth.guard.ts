import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  ALLOW_LIMITED_KEY,
  IS_PUBLIC_KEY,
  REQUIRED_ROLES_KEY,
  REQUIRED_SUB_ROLES_KEY,
} from './decorators.js';

const LIMITED_ROLE = 'LIMITED';

/**
 * Field roles live outside the dashboard: they may only reach endpoints that
 * name them explicitly through `@RequiredRoles`. Everything else is denied,
 * so adding a new controller never widens their access by accident.
 */
const FIELD_ROLES = new Set(['INSTALLER', 'WORKER']);

export const AUTH_INSTANCE = 'BETTER_AUTH';

let _fromNodeHeaders: typeof import('better-auth/node').fromNodeHeaders;

interface AuthenticatedRequest extends Request {
  user?: Record<string, unknown>;
  authSession?: Record<string, unknown>;
}

interface SessionResult {
  user: Record<string, unknown>;
  session: Record<string, unknown>;
}

interface BetterAuthInstance {
  api: {
    getSession(opts: { headers: Headers }): Promise<SessionResult | null>;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(AUTH_INSTANCE) private auth: BetterAuthInstance,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!_fromNodeHeaders) {
      const mod = await import('better-auth/node');
      _fromNodeHeaders = mod.fromNodeHeaders;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await this.auth.api.getSession({
      headers: _fromNodeHeaders(request.headers),
    });

    if (!session) throw new UnauthorizedException();

    if (session.user.disabled === true) {
      throw new UnauthorizedException('La cuenta está deshabilitada');
    }

    request.user = session.user;
    request.authSession = session.session;

    const userRole = session.user.role as string | undefined;

    const requiredRoles = this.reflector.getAllAndOverride<
      string[] | undefined
    >(REQUIRED_ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (userRole === LIMITED_ROLE) {
      const allowLimited = this.reflector.getAllAndOverride<boolean>(
        ALLOW_LIMITED_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!allowLimited) {
        throw new ForbiddenException('No tienes permisos para este recurso');
      }
    }

    if (userRole && FIELD_ROLES.has(userRole)) {
      if (!requiredRoles?.includes(userRole)) {
        throw new ForbiddenException('No tienes permisos para este recurso');
      }
    }

    if (requiredRoles?.length) {
      if (!userRole || !requiredRoles.includes(userRole)) {
        throw new ForbiddenException('No tienes permisos para este recurso');
      }
    }

    const requiredSubRoles = this.reflector.getAllAndOverride<
      string[] | undefined
    >(REQUIRED_SUB_ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (requiredSubRoles?.length) {
      const userSubRoles =
        (session.user.subRoles as string[] | undefined) ?? [];
      const hasAny = requiredSubRoles.some((sr) => userSubRoles.includes(sr));
      if (!hasAny) {
        throw new ForbiddenException('No tienes permisos para este recurso');
      }
    }

    return true;
  }
}
