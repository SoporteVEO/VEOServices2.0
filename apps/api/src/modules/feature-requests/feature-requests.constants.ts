import { type FeatureRequestStatus, Role } from '@prisma/client';
import { IMAGES_MODULE_ROLES } from '../auth/field-roles.js';

export const DEVELOPER_SUB_ROLE = 'DESARROLLADOR';

export const FEATURE_REQUEST_TICKET_PREFIX = 'SF';

export const FEATURE_REQUEST_FILE_FOLDER = 'feature-requests/files';
export const FEATURE_REQUEST_SIGNATURE_FOLDER = 'feature-requests/signatures';

export const MAX_FEATURE_REQUEST_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_SIGNATURE_BYTES = 512 * 1024;

export const FEATURE_REQUEST_FILE_KEY_REGEX = new RegExp(
  `^${FEATURE_REQUEST_FILE_FOLDER}/[A-Za-z0-9-]+\\.pdf$`,
);

export const MAX_COLLABORATORS = 20;

/** Roles that reach the module, so the only ones worth adding as collaborators. */
export const FEATURE_REQUEST_ROLES: Role[] = [
  Role.ADMIN,
  Role.USER,
  Role.LIMITED,
  ...IMAGES_MODULE_ROLES,
];

export const STATUS_LABELS: Record<FeatureRequestStatus, string> = {
  SUBMITTED: 'Enviada',
  IN_REVIEW: 'En revisión',
  IN_PROGRESS: 'En desarrollo',
  COMPLETED: 'Completada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

export const USER_REQUESTS_HREF = '/dashboard/solicitudes';
export const DEV_REQUESTS_HREF = '/dashboard/desarrollo/solicitudes';

export function userRequestHref(id: string): string {
  return `${USER_REQUESTS_HREF}?request=${id}`;
}

export function devRequestHref(id: string): string {
  return `${DEV_REQUESTS_HREF}?request=${id}`;
}

export function formatTicketNumber(number: number): string {
  return `${FEATURE_REQUEST_TICKET_PREFIX}-${String(number).padStart(4, '0')}`;
}

export function parseTicketNumber(value: string): number | undefined {
  const match = new RegExp(
    `^(?:${FEATURE_REQUEST_TICKET_PREFIX}-?)?0*(\\d{1,9})$`,
    'i',
  ).exec(value.trim());
  return match ? Number(match[1]) : undefined;
}
