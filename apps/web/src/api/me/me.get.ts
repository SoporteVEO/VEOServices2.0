import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  MeProfile,
  MeTeamMember,
  MeTeamMemberComment,
} from "./me.types";

export async function getMyProfile() {
  const response = await apiFetch<{ data: MeProfile }>("/me");
  return response.data;
}

function normalizeMeTeamMember(
  raw: MeTeamMember | null,
): MeTeamMember | null {
  if (!raw) return null;
  const ext = raw as MeTeamMember & {
    team_member_comments?: MeTeamMemberComment[];
  };
  const fromApi =
    ext.teamMemberComments ??
    ext.team_member_comments ??
    ([] as MeTeamMemberComment[]);
  const teamMemberComments = Array.isArray(fromApi) ? fromApi : [];
  return { ...raw, teamMemberComments };
}

export async function getMyTeamMember() {
  const response = await apiFetch<{ data: MeTeamMember | null }>(
    "/me/team-member",
  );
  return normalizeMeTeamMember(response.data);
}

export function useMyProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMyProfile,
  });
}

export function useMyTeamMember() {
  return useQuery({
    queryKey: ["me", "team-member", "v2"],
    queryFn: getMyTeamMember,
  });
}
