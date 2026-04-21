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
} from './decorators.js';

const LIMITED_ROLE = 'LIMITED';

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

    request.user = session.user;
    request.authSession = session.session;

    const userRole = session.user.role as string | undefined;

    if (userRole === LIMITED_ROLE) {
      const allowLimited = this.reflector.getAllAndOverride<boolean>(
        ALLOW_LIMITED_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!allowLimited) {
        throw new ForbiddenException('No tienes permisos para este recurso');
      }
    }

    const requiredRoles = this.reflector.getAllAndOverride<
      string[] | undefined
    >(REQUIRED_ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (requiredRoles?.length) {
      if (!userRole || !requiredRoles.includes(userRole)) {
        throw new ForbiddenException('No tienes permisos para este recurso');
      }
    }

    return true;
  }
}
