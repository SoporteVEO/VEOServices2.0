import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { TeamMember, TeamMemberDetail } from "./team-members.types";

export async function getTeamMembers() {
  const response = await apiFetch<{ data: TeamMember[] }>("/team-members");
  return response.data;
}

export async function getTeamMember(id: string) {
  const response = await apiFetch<{ data: TeamMemberDetail }>(
    `/team-members/${id}`,
  );
  return response.data;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
  });
}

export function useTeamMember(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["team-member", id],
    queryFn: () => getTeamMember(id!),
    enabled: Boolean(enabled && id),
  });
}
