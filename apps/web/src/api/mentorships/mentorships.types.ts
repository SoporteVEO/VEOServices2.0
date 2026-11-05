import type { HrCatalogEntry } from "@/api/hr-catalogs/hr-catalogs.types";
import type { TeamMemberStatus } from "@/api/team-members/team-members.types";

export type MentorshipStatus = "DONE" | "PENDING" | "OVERDUE";
export type MentorshipStartOutcome = "YES" | "PARTIAL" | "NO";
export type KssKind = "keep" | "stop" | "start";

export type MentorshipQuarter = {
  key: string;
  label: string;
  start: string;
  end: string;
  deadline: string;
};

export type KssItem = {
  what: string;
  how: string;
  when: string;
  indicator: string;
};

export type MentorshipCollaborator = {
  userId: string;
  name: string;
  email: string | null;
  position: string | null;
  department: HrCatalogEntry | null;
  boss: { id: string; name: string } | null;
  status: TeamMemberStatus;
  archived: boolean;
};

export type PreviousStart = KssItem & {
  sessionId: string;
  sessionNumber: number;
  sessionDate: string;
};

export type MentorshipSession = {
  id: string;
  sessionNumber: number;
  quarter: string;
  sessionDate: string;
  nextFollowUpDate: string;
  collaborator: {
    id: string;
    name: string;
    position: string | null;
    department: string | null;
  };
  mentor: { id: string | null; name: string };
  previousStart:
    | (PreviousStart & {
        outcome: MentorshipStartOutcome | null;
        evidence: string | null;
      })
    | null;
  keep: KssItem;
  stop: KssItem;
  start: KssItem;
  commitment: string;
  acknowledgedAt: string | null;
  acknowledgementComment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MentorshipRevisionChange = {
  field: string;
  label: string;
  from: string | null;
  to: string | null;
};

export type MentorshipRevision = {
  id: string;
  actorName: string;
  changes: MentorshipRevisionChange[];
  reason: string | null;
  createdAt: string;
};

export type MentorshipSessionDetail = MentorshipSession & {
  revisions: MentorshipRevision[];
  permissions: {
    canEdit: boolean;
    canAcknowledge: boolean;
    editRequiresReason: boolean;
  };
};

export type MentorshipOverview = {
  isHr: boolean;
  teamCount: number;
  pendingAcknowledgements: number;
  quarter: MentorshipQuarter;
  today: string;
};

export type MentorshipSessionBrief = {
  id: string;
  sessionNumber: number;
  sessionDate: string;
  nextFollowUpDate: string;
  startWhat: string;
  acknowledgedAt: string | null;
};

export type MentorshipTeamMember = MentorshipCollaborator & {
  quarterStatus: MentorshipStatus;
  quarterSession: MentorshipSessionBrief | null;
  lastSession: MentorshipSessionBrief | null;
  totalSessions: number;
};

export type MentorshipTeam = {
  quarter: MentorshipQuarter;
  members: MentorshipTeamMember[];
};

export type MentorshipDraft = {
  sessionNumber: number;
  mentorName: string;
  today: string;
  minSessionDate: string | null;
  previousStart: (PreviousStart & { commitment: string }) | null;
};

export type MentorshipCollaboratorProfile = {
  collaborator: MentorshipCollaborator;
  quarter: MentorshipQuarter;
  quarterStatus: MentorshipStatus | null;
  sessions: MentorshipSession[];
  permissions: { canRegister: boolean };
  draft: MentorshipDraft | null;
};

export type MentorshipSummary = {
  collaborators: number;
  done: number;
  pending: number;
  overdue: number;
  startEvaluated: number;
  startYes: number;
  startPartial: number;
  startNo: number;
  startCompliance: number | null;
  completion: number | null;
};

export type MentorshipDashboardRow = Omit<MentorshipCollaborator, "status"> & {
  departmentId: string | null;
  departmentName: string;
  status: MentorshipStatus;
  startOutcome: MentorshipStartOutcome | null;
  session: {
    id: string;
    sessionNumber: number;
    sessionDate: string;
    acknowledgedAt: string | null;
  } | null;
};

export type MentorshipDashboard = {
  quarter: MentorshipQuarter;
  quarters: MentorshipQuarter[];
  totals: MentorshipSummary;
  departments: (MentorshipSummary & { id: string | null; name: string })[];
  collaborators: MentorshipDashboardRow[];
};

export type MentorshipHistoryRow = MentorshipCollaborator & {
  totalSessions: number;
  lastSessionDate: string | null;
};

export type MentorshipSessionInput = {
  sessionDate: string;
  nextFollowUpDate: string;
  previousStartOutcome?: MentorshipStartOutcome;
  previousStartEvidence?: string;
  keep: KssItem;
  stop: KssItem;
  start: KssItem;
  commitment: string;
};

export type CreateMentorshipSessionInput = MentorshipSessionInput & {
  collaboratorId: string;
};

export type UpdateMentorshipSessionInput = MentorshipSessionInput & {
  reason?: string;
};
