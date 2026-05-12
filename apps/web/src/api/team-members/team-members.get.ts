import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { TeamMember } from "./team-members.types";

export async function getTeamMembers() {
  const response = await apiFetch<{ data: TeamMember[] }>("/team-members");
  return response.data;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
  });
}
