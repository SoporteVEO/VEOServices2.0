import type { CrmStageKind } from '@prisma/client';

export const CRM_SUB_ROLE = 'VENTAS';

export const DEFAULT_PIPELINE_NAME = 'Ventas';

export const DEFAULT_STAGES: {
  name: string;
  color: string;
  probability: number;
  kind: CrmStageKind;
  rottingDays: number | null;
}[] = [
  {
    name: 'Brief recibido',
    color: '#94A3B8',
    probability: 10,
    kind: 'OPEN',
    rottingDays: 7,
  },
  {
    name: 'Propuesta y disponibilidad',
    color: '#38BDF8',
    probability: 30,
    kind: 'OPEN',
    rottingDays: 7,
  },
  {
    name: 'Reserva activa',
    color: '#A78BFA',
    probability: 60,
    kind: 'OPEN',
    rottingDays: 5,
  },
  {
    name: 'Negociación',
    color: '#F59E0B',
    probability: 80,
    kind: 'OPEN',
    rottingDays: 5,
  },
  {
    name: 'Orden firmada',
    color: '#22C55E',
    probability: 100,
    kind: 'WON',
    rottingDays: null,
  },
  {
    name: 'Perdido',
    color: '#EF4444',
    probability: 0,
    kind: 'LOST',
    rottingDays: null,
  },
];

/** Closed deals stay on the board this long so recent wins remain visible. */
export const BOARD_CLOSED_WINDOW_DAYS = 30;

export const DEFAULT_STALE_DAYS = 14;

export const DEFAULT_PHONE_COUNTRY_CODE =
  process.env.CRM_DEFAULT_PHONE_COUNTRY_CODE ?? '503';

export interface CrmAuthUser {
  id: string;
  firstName?: string;
  lastName?: string | null;
  email?: string;
  role?: string;
}

export const USER_SUMMARY_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export interface CrmUserSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export function fullName(user: {
  firstName: string;
  lastName: string | null;
}): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ');
}

/** Digits only with country code; 8-digit local numbers get the default one. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 8) return `${DEFAULT_PHONE_COUNTRY_CODE}${digits}`;
  return digits;
}
