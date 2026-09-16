import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRED_ROLES_KEY = 'requiredRoles';
export const RequiredRoles = (...roles: string[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);

export const REQUIRED_SUB_ROLES_KEY = 'requiredSubRoles';
export const RequiredSubRoles = (...subRoles: string[]) =>
  SetMetadata(REQUIRED_SUB_ROLES_KEY, subRoles);

export const ALLOW_LIMITED_KEY = 'allowLimited';
export const AllowLimited = () => SetMetadata(ALLOW_LIMITED_KEY, true);

/**
 * Lifts the field-role deny-by-default for the named roles only. Unlike
 * `@RequiredRoles` it does not narrow the endpoint for anybody else, so it can
 * be added to a controller that already serves the dashboard.
 */
export const ALLOWED_FIELD_ROLES_KEY = 'allowedFieldRoles';
export const AllowFieldRoles = (...roles: string[]) =>
  SetMetadata(ALLOWED_FIELD_ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => {
    const req: { user?: unknown } = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
