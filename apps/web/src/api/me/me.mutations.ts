import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MeProfile, UpdateMeInput } from "./me.types";

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
