import type { MentorshipStartOutcome } from '@prisma/client';
import { toIsoDay } from './mentorship-quarter.js';
import {
  MENTORSHIP_FIELD_LABELS,
  START_OUTCOME_LABELS,
} from './mentorships.constants.js';
import { KSS_TEXT_FIELDS, type KssTextField } from './mentorship.selects.js';

export type EditableSessionValues = Record<KssTextField, string> & {
  sessionDate: Date;
  nextFollowUpDate: Date;
  previousStartOutcome: MentorshipStartOutcome | null;
  previousStartEvidence: string | null;
  commitment: string;
};

export type EditableSessionField = keyof EditableSessionValues;

export interface SessionChange {
  field: EditableSessionField;
  label: string;
  from: string | null;
  to: string | null;
}

const EDITABLE_FIELDS: EditableSessionField[] = [
  'sessionDate',
  'nextFollowUpDate',
  'previousStartOutcome',
  'previousStartEvidence',
  ...KSS_TEXT_FIELDS,
  'commitment',
];

function display(
  field: EditableSessionField,
  value: EditableSessionValues[EditableSessionField] | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return toIsoDay(value);
  if (field === 'previousStartOutcome') {
    return START_OUTCOME_LABELS[value as MentorshipStartOutcome];
  }
  return value;
}

/** Lists the fields `next` actually changes, in a readable form for the audit trail. */
export function diffSession(
  current: EditableSessionValues,
  next: Partial<EditableSessionValues>,
): SessionChange[] {
  const changes: SessionChange[] = [];
  for (const field of EDITABLE_FIELDS) {
    if (!(field in next)) continue;
    const from = display(field, current[field]);
    const to = display(field, next[field]);
    if (from === to) continue;
    changes.push({ field, label: MENTORSHIP_FIELD_LABELS[field], from, to });
  }
  return changes;
}
