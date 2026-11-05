import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  MentorshipCollaboratorProfile,
  MentorshipDashboard,
  MentorshipHistoryRow,
  MentorshipOverview,
  MentorshipSession,
  MentorshipSessionDetail,
  MentorshipTeam,
} from "./mentorships.types";

export const MENTORSHIPS_QUERY_KEY = ["mentorships"] as const;

function quarterQuery(quarter?: string) {
  return quarter ? { query: { quarter } } : undefined;
}

export function useMentorshipOverview() {
  return useQuery({
    queryKey: [...MENTORSHIPS_QUERY_KEY, "overview"],
    queryFn: async () => {
      const response = await apiFetch<{ data: MentorshipOverview }>(
        "/mentorships/overview",
      );
      return response.data;
    },
  });
}

export function useMentorshipTeam(enabled: boolean) {
  return useQuery({
    queryKey: [...MENTORSHIPS_QUERY_KEY, "team"],
    queryFn: async () => {
      const response = await apiFetch<{ data: MentorshipTeam }>(
        "/mentorships/team",
      );
      return response.data;
    },
    enabled,
  });
}

export function useMyMentorships() {
  return useQuery({
    queryKey: [...MENTORSHIPS_QUERY_KEY, "mine"],
    queryFn: async () => {
      const response = await apiFetch<{ data: MentorshipSession[] }>(
        "/mentorships/mine",
      );
      return response.data;
    },
  });
}

export function useMentorshipCollaborator(userId: string | null) {
  return useQuery({
    queryKey: [...MENTORSHIPS_QUERY_KEY, "collaborator", userId],
    queryFn: async () => {
      const response = await apiFetch<{ data: MentorshipCollaboratorProfile }>(
        `/mentorships/collaborators/${userId}`,
      );
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useMentorshipSession(id: string | null) {
  return useQuery({
    queryKey: [...MENTORSHIPS_QUERY_KEY, "session", id],
    queryFn: async () => {
      const response = await apiFetch<{ data: MentorshipSessionDetail }>(
        `/mentorships/${id}`,
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useMentorshipDashboard(
  quarter: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...MENTORSHIPS_QUERY_KEY, "dashboard", quarter ?? "current"],
    queryFn: async () => {
      const response = await apiFetch<{ data: MentorshipDashboard }>(
        "/mentorships/dashboard",
        quarterQuery(quarter),
      );
      return response.data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useMentorshipHistory(enabled: boolean) {
  return useQuery({
    queryKey: [...MENTORSHIPS_QUERY_KEY, "history"],
    queryFn: async () => {
      const response = await apiFetch<{ data: MentorshipHistoryRow[] }>(
        "/mentorships/collaborators",
      );
      return response.data;
    },
    enabled,
  });
}
