export type TeamMemberUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
};

export type TeamMember = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string | null;
  businessEmail: string;
  position: string;
  salary: number;
  vacations: number;
  usedVacations: number;
  createdAt: string;
  updatedAt: string;
  user: TeamMemberUser;
};

export type CreateTeamMemberInput = {
  userId: string;
  firstName: string;
  lastName?: string;
  businessEmail: string;
  position: string;
  salary: number;
  vacations: number;
  usedVacations: number;
};

export type UpdateTeamMemberInput = Partial<CreateTeamMemberInput>;
