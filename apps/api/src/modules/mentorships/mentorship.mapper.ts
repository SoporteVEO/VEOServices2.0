import { toIsoDay } from './mentorship-quarter.js';
import type {
  PlacementRow,
  SessionDetailRow,
  SessionRow,
} from './mentorship.selects.js';

export function personName(user: {
  firstName: string;
  lastName: string | null;
}): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
}

export function toSessionDto(row: SessionRow) {
  const previous = row.previousSession;
  return {
    id: row.id,
    sessionNumber: row.sessionNumber,
    quarter: row.quarter,
    sessionDate: toIsoDay(row.sessionDate),
    nextFollowUpDate: toIsoDay(row.nextFollowUpDate),
    collaborator: {
      id: row.collaboratorId,
      name: row.collaboratorName,
      position: row.collaboratorPosition,
      department: row.collaboratorDepartment,
    },
    mentor: { id: row.mentorId, name: row.mentorName },
    previousStart: previous
      ? {
          sessionId: previous.id,
          sessionNumber: previous.sessionNumber,
          sessionDate: toIsoDay(previous.sessionDate),
          what: previous.startWhat,
          how: previous.startHow,
          when: previous.startWhen,
          indicator: previous.startIndicator,
          outcome: row.previousStartOutcome,
          evidence: row.previousStartEvidence,
        }
      : null,
    keep: {
      what: row.keepWhat,
      how: row.keepHow,
      when: row.keepWhen,
      indicator: row.keepIndicator,
    },
    stop: {
      what: row.stopWhat,
      how: row.stopHow,
      when: row.stopWhen,
      indicator: row.stopIndicator,
    },
    start: {
      what: row.startWhat,
      how: row.startHow,
      when: row.startWhen,
      indicator: row.startIndicator,
    },
    commitment: row.commitment,
    acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
    acknowledgementComment: row.acknowledgementComment,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toRevisionDtos(revisions: SessionDetailRow['revisions']) {
  return revisions.map((revision) => ({
    id: revision.id,
    actorName: revision.actorName,
    changes: revision.changes,
    reason: revision.reason,
    createdAt: revision.createdAt.toISOString(),
  }));
}

export function toCollaboratorDto(placement: PlacementRow) {
  return {
    userId: placement.userId,
    name: placement.fullName,
    email: placement.businessEmail || placement.user.email,
    position: placement.position?.name ?? null,
    department: placement.department,
    boss: placement.directBoss
      ? {
          id: placement.directBoss.id,
          name: personName(placement.directBoss),
        }
      : null,
    status: placement.status,
    archived: placement.status === 'TERMINATED',
  };
}
