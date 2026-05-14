import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CreateTeamMemberCommentInput,
  CreateTeamMemberInput,
  TeamMember,
  TeamMemberComment,
  UpdateTeamMemberInput,
} from "./team-members.types";

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTeamMemberInput) => {
      const { data } = await api.post<{ data: TeamMember }>(
        "/team-members",
        input,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-members"] }),
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateTeamMemberInput & { id: string }) => {
      const { data } = await api.patch<{ data: TeamMember }>(
        `/team-members/${id}`,
        input,
      );
      return data.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-member", variables.id] });
    },
  });
}

export function useCreateTeamMemberComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teamMemberId,
      ...input
    }: CreateTeamMemberCommentInput & { teamMemberId: string }) => {
      const { data } = await api.post<{ data: TeamMemberComment }>(
        `/team-members/${teamMemberId}/comments`,
        input,
      );
      return data.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["team-member", variables.teamMemberId] });
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["me", "team-member"] });
    },
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/team-members/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-members"] }),
  });
}
