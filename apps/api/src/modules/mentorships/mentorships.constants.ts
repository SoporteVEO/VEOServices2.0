export const HR_SUB_ROLE = 'HR';

export const MENTORSHIPS_PATH = '/dashboard/rh/mentorias';

/** Days before the follow-up date when boss and collaborator get a reminder. */
export const FOLLOW_UP_REMINDER_DAYS = 3;

/** How long a lazily triggered sweep is considered fresh on one instance. */
export const SWEEP_THROTTLE_MS = 30 * 60 * 1000;

export const MENTORSHIP_TEXT_MAX_LENGTH = 2000;

export const UNASSIGNED_DEPARTMENT = 'Sin área asignada';

export const START_OUTCOME_LABELS = {
  YES: 'Sí',
  PARTIAL: 'Parcial',
  NO: 'No',
} as const;

export const MENTORSHIP_FIELD_LABELS: Record<string, string> = {
  sessionDate: 'Fecha de la sesión',
  nextFollowUpDate: 'Fecha de próximo seguimiento',
  previousStartOutcome: 'Start anterior: ¿se cumplió?',
  previousStartEvidence: 'Start anterior: evidencia / indicador',
  keepWhat: 'Keep · Qué',
  keepHow: 'Keep · Cómo',
  keepWhen: 'Keep · Cuándo',
  keepIndicator: 'Keep · Indicador',
  stopWhat: 'Stop · Qué',
  stopHow: 'Stop · Cómo',
  stopWhen: 'Stop · Cuándo',
  stopIndicator: 'Stop · Indicador',
  startWhat: 'Start · Qué',
  startHow: 'Start · Cómo',
  startWhen: 'Start · Cuándo',
  startIndicator: 'Start · Indicador',
  commitment: 'Compromiso concreto',
};

export function mentorshipSessionHref(sessionId: string): string {
  return `${MENTORSHIPS_PATH}?session=${sessionId}`;
}
