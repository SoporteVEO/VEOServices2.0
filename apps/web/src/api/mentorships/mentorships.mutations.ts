import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { MENTORSHIPS_QUERY_KEY } from "./mentorships.get";
import type {
  CreateMentorshipSessionInput,
  MentorshipSession,
  MentorshipSessionDetail,
  UpdateMentorshipSessionInput,
} from "./mentorships.types";

/** Status, counters and histories all depend on each session, so refresh them together. */
function useRefreshMentorships() {
  const queryClient = useQueryClient();
  return async (detail?: MentorshipSessionDetail) => {
    if (detail) {
      queryClient.setQueryData(
        [...MENTORSHIPS_QUERY_KEY, "session", detail.id],
        detail,
      );
    }
    await queryClient.invalidateQueries({ queryKey: MENTORSHIPS_QUERY_KEY });
  };
}

export function useCreateMentorshipSession() {
  const refresh = useRefreshMentorships();
  return useMutation({
    mutationFn: async (input: CreateMentorshipSessionInput) => {
      const response = await apiFetch<{ data: MentorshipSession }>(
        "/mentorships",
        { method: "POST", body: JSON.stringify(input) },
      );
      return response.data;
    },
    onSuccess: () => refresh(),
  });
}

export function useUpdateMentorshipSession(id: string) {
  const refresh = useRefreshMentorships();
  return useMutation({
    mutationFn: async (input: UpdateMentorshipSessionInput) => {
      const response = await apiFetch<{ data: MentorshipSessionDetail }>(
        `/mentorships/${id}`,
        { method: "PATCH", body: JSON.stringify(input) },
      );
      return response.data;
    },
    onSuccess: refresh,
  });
}

export function useAcknowledgeMentorshipSession(id: string) {
  const refresh = useRefreshMentorships();
  return useMutation({
    mutationFn: async (comment: string) => {
      const response = await apiFetch<{ data: MentorshipSessionDetail }>(
        `/mentorships/${id}/acknowledge`,
        {
          method: "POST",
          body: JSON.stringify(comment ? { comment } : {}),
        },
      );
      return response.data;
    },
    onSuccess: refresh,
  });
}
