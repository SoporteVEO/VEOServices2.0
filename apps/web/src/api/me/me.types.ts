import type { TeamMember } from "@/api/team-members/team-members.types";
import type { User } from "@/api/users/users.types";

export type MeProfile = User;

export type MeTeamMember = TeamMember;

export type UpdateMeInput = {
  firstName?: string;
  lastName?: string;
  password?: string;
};
