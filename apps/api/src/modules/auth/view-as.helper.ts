import { ForbiddenException } from '@nestjs/common';

/**
 * Resolves the user id whose data should be queried.
 *
 * When the current user is an ADMIN, they may pass `viewAsUserId` to
 * impersonate another user for read-only "view as" purposes. For any other
 * role the parameter is ignored if it matches the requesting user, otherwise
 * a 403 is thrown.
 */
export function resolveTargetUserId(
  currentUser: { id: string; role?: string | null },
  viewAsUserId: string | undefined | null,
): string {
  const trimmed = typeof viewAsUserId === 'string' ? viewAsUserId.trim() : '';
  if (!trimmed) return currentUser.id;
  if (trimmed === currentUser.id) return currentUser.id;

  if (currentUser.role !== 'ADMIN') {
    throw new ForbiddenException(
      'No tienes permisos para ver datos de otro usuario.',
    );
  }
  return trimmed;
}
