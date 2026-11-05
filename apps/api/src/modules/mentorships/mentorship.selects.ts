import type { Prisma } from '@prisma/client';
import { quarterStartInstant, type QuarterInfo } from './mentorship-quarter.js';

export const KSS_TEXT_FIELDS = [
  'keepWhat',
  'keepHow',
  'keepWhen',
  'keepIndicator',
  'stopWhat',
  'stopHow',
  'stopWhen',
  'stopIndicator',
  'startWhat',
  'startHow',
  'startWhen',
  'startIndicator',
] as const;

export type KssTextField = (typeof KSS_TEXT_FIELDS)[number];

export const SESSION_SELECT = {
  id: true,
  collaboratorId: true,
  mentorId: true,
  sessionNumber: true,
  quarter: true,
  collaboratorName: true,
  collaboratorPosition: true,
  collaboratorDepartment: true,
  mentorName: true,
  sessionDate: true,
  nextFollowUpDate: true,
  previousSessionId: true,
  previousStartOutcome: true,
  previousStartEvidence: true,
  keepWhat: true,
  keepHow: true,
  keepWhen: true,
  keepIndicator: true,
  stopWhat: true,
  stopHow: true,
  stopWhen: true,
  stopIndicator: true,
  startWhat: true,
  startHow: true,
  startWhen: true,
  startIndicator: true,
  commitment: true,
  acknowledgedAt: true,
  acknowledgementComment: true,
  createdAt: true,
  updatedAt: true,
  previousSession: {
    select: {
      id: true,
      sessionNumber: true,
      sessionDate: true,
      startWhat: true,
      startHow: true,
      startWhen: true,
      startIndicator: true,
    },
  },
} satisfies Prisma.MentorshipSessionSelect;

export type SessionRow = Prisma.MentorshipSessionGetPayload<{
  select: typeof SESSION_SELECT;
}>;

export const SESSION_DETAIL_SELECT = {
  ...SESSION_SELECT,
  revisions: {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      actorName: true,
      changes: true,
      reason: true,
      createdAt: true,
    },
  },
} satisfies Prisma.MentorshipSessionSelect;

export type SessionDetailRow = Prisma.MentorshipSessionGetPayload<{
  select: typeof SESSION_DETAIL_SELECT;
}>;

export const PLACEMENT_SELECT = {
  id: true,
  userId: true,
  fullName: true,
  status: true,
  directBossId: true,
  businessEmail: true,
  startDate: true,
  createdAt: true,
  position: { select: { name: true } },
  department: { select: { id: true, name: true } },
  directBoss: { select: { id: true, firstName: true, lastName: true } },
  user: { select: { email: true } },
} satisfies Prisma.TeamMemberSelect;

export type PlacementRow = Prisma.TeamMemberGetPayload<{
  select: typeof PLACEMENT_SELECT;
}>;

/** Prisma filter matching `joinedBeforeQuarter`. */
export function joinedBeforeQuarterWhere(
  quarter: QuarterInfo,
): Prisma.TeamMemberWhereInput {
  return {
    OR: [
      { startDate: { lt: quarter.start } },
      { startDate: null, createdAt: { lt: quarterStartInstant(quarter) } },
    ],
  };
}
