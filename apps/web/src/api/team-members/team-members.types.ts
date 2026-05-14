export type TeamMemberUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
};

export type TeamMemberDirectBoss = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
};

export type ContractType =
  | "FULL_TIME"
  | "TEMPORAL"
  | "FREELANCE"
  | "PART_TIME"
  | "INTERNSHIP"
  | "PROFESSIONAL_SERVICES";

export type TeamMemberStatus = "ACTIVE" | "INACTIVE" | "TERMINATED";

export type TeamMemberComment = {
  id: string;
  teamMemberId: string;
  comment: string;
  showToUser: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamMember = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string | null;
  secondLastName: string | null;
  fullName: string;
  dui: string | null;
  inss: string | null;
  afpNumber: string | null;
  afpEntity: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bornDate: string | null;
  startDate: string | null;
  endDate: string | null;
  contractType: ContractType;
  status: TeamMemberStatus;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  directBossId: string | null;
  businessEmail: string;
  position: string;
  salary: number;
  createdAt: string;
  updatedAt: string;
  user: TeamMemberUser;
  directBoss: TeamMemberDirectBoss | null;
};

export type TeamMemberDetail = TeamMember & {
  teamMemberComments: TeamMemberComment[];
};

export type CreateTeamMemberCommentInput = {
  comment: string;
  showToUser?: boolean;
};

export type CreateTeamMemberInput = {
  userId: string;
  firstName: string;
  lastName?: string | null;
  secondLastName?: string | null;
  dui?: string | null;
  inss?: string | null;
  afpNumber?: string | null;
  afpEntity?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bornDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  contractType?: ContractType;
  status?: TeamMemberStatus;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  directBossId?: string | null;
  businessEmail: string;
  position: string;
  salary: number;
};

export type UpdateTeamMemberInput = Partial<CreateTeamMemberInput>;
