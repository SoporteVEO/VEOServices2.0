import type { Prisma } from '@prisma/client';

export const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export const LIST_SELECT = {
  id: true,
  number: true,
  title: true,
  summary: true,
  priority: true,
  status: true,
  completionRound: true,
  completedAt: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  requester: { select: USER_SELECT },
  collaborators: { select: { userId: true } },
  signatures: { select: { userId: true, round: true } },
} as const;

export const DETAIL_SELECT = {
  id: true,
  number: true,
  title: true,
  summary: true,
  priority: true,
  status: true,
  completionRound: true,
  completedAt: true,
  approvedAt: true,
  fileName: true,
  fileSize: true,
  createdAt: true,
  updatedAt: true,
  requester: { select: USER_SELECT },
  collaborators: {
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true, user: { select: USER_SELECT } },
  },
  signatures: {
    orderBy: { signedAt: 'asc' },
    select: {
      id: true,
      userId: true,
      round: true,
      signerName: true,
      signerEmail: true,
      imageS3Key: true,
      signedAt: true,
    },
  },
  events: {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      fromStatus: true,
      toStatus: true,
      message: true,
      createdAt: true,
      actor: { select: USER_SELECT },
    },
  },
} as const satisfies Prisma.FeatureRequestSelect;

export type FeatureRequestListRow = Prisma.FeatureRequestGetPayload<{
  select: typeof LIST_SELECT;
}>;

export type FeatureRequestDetailRow = Prisma.FeatureRequestGetPayload<{
  select: typeof DETAIL_SELECT;
}>;

export type FeatureRequestViewer = {
  id: string;
  isDeveloper: boolean;
};
