import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MeProfile, MeTeamMember } from "./me.types";

export async function getMyProfile() {
  const response = await apiFetch<{ data: MeProfile }>("/me");
  return response.data;
}

export async function getMyTeamMember() {
  const response = await apiFetch<{ data: MeTeamMember | null }>(
    "/me/team-member",
  );
  return response.data;
}

export function useMyProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMyProfile,
  });
}

export function useMyTeamMember() {
  return useQuery({
    queryKey: ["me", "team-member"],
    queryFn: getMyTeamMember,
  });
}
