import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators.js';

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
    return true;
  }
}
