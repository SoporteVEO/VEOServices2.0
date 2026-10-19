import { FeatureRequestStatus } from '@prisma/client';
import type { S3StorageService } from '../s3-images/s3-storage.service.js';
import { formatTicketNumber } from './feature-requests.constants.js';
import type {
  FeatureRequestDetailRow,
  FeatureRequestListRow,
  FeatureRequestViewer,
} from './feature-request.selects.js';

const CLOSED_STATUSES: FeatureRequestStatus[] = [
  FeatureRequestStatus.APPROVED,
  FeatureRequestStatus.REJECTED,
];

type ProgressSource = {
  completionRound: number;
  requester: { id: string };
  collaborators: { userId?: string; user?: { id: string } }[];
  signatures: { userId: string | null; round: number }[];
};

export function isClosed(status: FeatureRequestStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}

/** Who must sign the current delivery and who already did. */
export function signatureProgress(row: ProgressSource) {
  const participantIds = [
    row.requester.id,
    ...row.collaborators.map((c) => c.userId ?? c.user?.id ?? ''),
  ].filter(Boolean);
  const signedIds = new Set(
    row.signatures
      .filter((s) => s.userId && s.round === row.completionRound)
      .map((s) => s.userId as string),
  );
  return {
    participantIds,
    signedIds,
    required: participantIds.length,
    signed: participantIds.filter((id) => signedIds.has(id)).length,
  };
}

export function toListItem(row: FeatureRequestListRow, viewerId: string) {
  const progress = signatureProgress(row);
  return {
    id: row.id,
    ticket: formatTicketNumber(row.number),
    number: row.number,
    title: row.title,
    summary: row.summary,
    priority: row.priority,
    status: row.status,
    completedAt: row.completedAt,
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    requester: row.requester,
    collaboratorCount: row.collaborators.length,
    signatures: { signed: progress.signed, required: progress.required },
    awaitingMySignature:
      row.status === FeatureRequestStatus.COMPLETED &&
      progress.participantIds.includes(viewerId) &&
      !progress.signedIds.has(viewerId),
  };
}

export async function toDetail(
  row: FeatureRequestDetailRow,
  viewer: FeatureRequestViewer,
  storage: S3StorageService,
) {
  const progress = signatureProgress(row);
  const isRequester = row.requester.id === viewer.id;
  const isParticipant = progress.participantIds.includes(viewer.id);
  const hasSigned = progress.signedIds.has(viewer.id);
  const awaitingSignature =
    row.status === FeatureRequestStatus.COMPLETED &&
    isParticipant &&
    !hasSigned;

  const participants = [
    { user: row.requester, isRequester: true },
    ...row.collaborators.map((c) => ({ user: c.user, isRequester: false })),
  ].map((participant) => ({
    ...participant,
    signed: progress.signedIds.has(participant.user.id),
  }));

  const signatures = await Promise.all(
    row.signatures.map(async ({ imageS3Key, ...signature }) => ({
      ...signature,
      imageUrl: await storage.getSignedUrl(imageS3Key),
    })),
  );

  return {
    id: row.id,
    ticket: formatTicketNumber(row.number),
    number: row.number,
    title: row.title,
    summary: row.summary,
    priority: row.priority,
    status: row.status,
    completionRound: row.completionRound,
    completedAt: row.completedAt,
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    requester: row.requester,
    attachment: { fileName: row.fileName, fileSize: row.fileSize },
    participants,
    signatureProgress: { signed: progress.signed, required: progress.required },
    signatures,
    events: row.events,
    permissions: {
      isRequester,
      isDeveloper: viewer.isDeveloper,
      canManageCollaborators: isRequester && !isClosed(row.status),
      canSign: awaitingSignature,
      canReportProblem: awaitingSignature,
      canChangeStatus:
        viewer.isDeveloper && row.status !== FeatureRequestStatus.APPROVED,
    },
  };
}

export type FeatureRequestDetail = Awaited<ReturnType<typeof toDetail>>;

export function userFullName(user: {
  firstName: string;
  lastName: string | null;
  email?: string;
}): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.email ||
    'Usuario'
  );
}
