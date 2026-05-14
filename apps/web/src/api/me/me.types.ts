import type { TeamMember } from "@/api/team-members/team-members.types";
import type { User } from "@/api/users/users.types";

export type MeProfile = User;

export type MeTeamMemberComment = {
  id: string;
  comment: string;
  createdAt: string;
};

export type MeTeamMember = TeamMember & {
  teamMemberComments: MeTeamMemberComment[];
};

export type UpdateMeInput = {
  firstName?: string;
  lastName?: string;
  password?: string;
};

export type UpdateMyTeamMemberInput = {
  firstName?: string;
  lastName?: string | null;
  secondLastName?: string | null;
  bornDate?: string | null;
  dui?: string | null;
  inss?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  afpNumber?: string | null;
  afpEntity?: string | null;
};
