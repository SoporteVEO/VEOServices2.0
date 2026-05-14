import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MeProfile, MeTeamMember, UpdateMeInput, UpdateMyTeamMemberInput } from "./me.types";

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateMeInput) => {
      const { data } = await api.patch<{ data: MeProfile }>("/me", input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useUpdateMyTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateMyTeamMemberInput) => {
      const { data } = await api.patch<{ data: MeTeamMember }>(
        "/me/team-member",
        input,
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["me", "team-member"] }),
  });
}
