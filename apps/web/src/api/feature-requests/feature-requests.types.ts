export type FeatureRequestStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "APPROVED"
  | "REJECTED";

export type FeatureRequestPriority = "LOW" | "MEDIUM" | "HIGH";

export type FeatureRequestEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "COMMENT"
  | "COLLABORATOR_ADDED"
  | "COLLABORATOR_REMOVED"
  | "SIGNED"
  | "PROBLEM_REPORTED"
  | "APPROVED";

export type FeatureRequestUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
};

export type FeatureRequestListItem = {
  id: string;
  ticket: string;
  number: number;
  title: string;
  summary: string;
  priority: FeatureRequestPriority;
  status: FeatureRequestStatus;
  completedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: FeatureRequestUser;
  collaboratorCount: number;
  signatures: { signed: number; required: number };
  awaitingMySignature: boolean;
};

export type FeatureRequestParticipant = {
  user: FeatureRequestUser;
  isRequester: boolean;
  signed: boolean;
};

export type FeatureRequestSignature = {
  id: string;
  userId: string | null;
  round: number;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  imageUrl: string;
};

export type FeatureRequestEvent = {
  id: string;
  type: FeatureRequestEventType;
  fromStatus: FeatureRequestStatus | null;
  toStatus: FeatureRequestStatus | null;
  message: string | null;
  createdAt: string;
  actor: FeatureRequestUser | null;
};

export type FeatureRequestPermissions = {
  isRequester: boolean;
  isDeveloper: boolean;
  canManageCollaborators: boolean;
  canSign: boolean;
  canReportProblem: boolean;
  canChangeStatus: boolean;
};

export type FeatureRequestDetail = {
  id: string;
  ticket: string;
  number: number;
  title: string;
  summary: string;
  priority: FeatureRequestPriority;
  status: FeatureRequestStatus;
  completionRound: number;
  completedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: FeatureRequestUser;
  attachment: { fileName: string; fileSize: number };
  participants: FeatureRequestParticipant[];
  signatureProgress: { signed: number; required: number };
  signatures: FeatureRequestSignature[];
  events: FeatureRequestEvent[];
  permissions: FeatureRequestPermissions;
};

export type PaginatedFeatureRequests = {
  data: FeatureRequestListItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<FeatureRequestStatus, number>;
};

export type CreateFeatureRequestInput = {
  title: string;
  summary: string;
  priority: FeatureRequestPriority;
  file: File;
  collaboratorIds: string[];
};

export type UpdateFeatureRequestStatusInput = {
  status: Extract<
    FeatureRequestStatus,
    "IN_REVIEW" | "IN_PROGRESS" | "COMPLETED" | "REJECTED"
  >;
  message?: string;
};
