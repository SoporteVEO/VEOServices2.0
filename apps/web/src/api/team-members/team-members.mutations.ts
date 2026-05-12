import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CreateTeamMemberInput,
  TeamMember,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-members"] }),
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
