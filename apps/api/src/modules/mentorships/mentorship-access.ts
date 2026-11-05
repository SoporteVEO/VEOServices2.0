import type { TeamMemberStatus } from '@prisma/client';

export interface MentorshipViewer {
  id: string;
  isHr: boolean;
}

/** Where the collaborator sits in the org chart right now. */
export interface CollaboratorPlacement {
  userId: string;
  status: TeamMemberStatus;
  directBossId: string | null;
}

/**
 * Talento Humano sees everybody. The collaborator sees their own history
 * until they leave the company; the current direct boss sees it while the
 * collaborator is active. Nobody else gets in.
 */
export function canViewCollaborator(
  viewer: MentorshipViewer,
  placement: CollaboratorPlacement | null,
): boolean {
  if (viewer.isHr) return true;
  if (!placement) return false;
  if (placement.userId === viewer.id) {
    return placement.status !== 'TERMINATED';
  }
  return isCurrentBoss(viewer, placement);
}

export function isCurrentBoss(
  viewer: MentorshipViewer,
  placement: CollaboratorPlacement | null,
): boolean {
  return (
    !!placement &&
    placement.status === 'ACTIVE' &&
    placement.directBossId === viewer.id
  );
}

/** Only the direct boss on the org chart registers sessions. */
export function canRegisterSession(
  viewer: MentorshipViewer,
  placement: CollaboratorPlacement | null,
): boolean {
  return isCurrentBoss(viewer, placement);
}

/**
 * The boss may fix a session until the collaborator confirms it; after that
 * only Talento Humano can correct it.
 */
export function canEditSession(
  viewer: MentorshipViewer,
  session: { acknowledgedAt: Date | null },
  placement: CollaboratorPlacement | null,
): boolean {
  if (viewer.isHr) return true;
  return !session.acknowledgedAt && isCurrentBoss(viewer, placement);
}

export function canAcknowledgeSession(
  viewer: MentorshipViewer,
  session: { collaboratorId: string; acknowledgedAt: Date | null },
): boolean {
  return session.collaboratorId === viewer.id && !session.acknowledgedAt;
}
