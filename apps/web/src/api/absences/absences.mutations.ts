import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Absence,
  AbsenceStatus,
  CreateAbsenceInput,
  UpdateAbsenceInput,
} from "./absences.types";

export function useCreateMyAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAbsenceInput) => {
      const { data } = await api.post<{ data: Absence }>(
        "/me/absences",
        input,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["absences"] }),
  });
}

export function useUpdateMyAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateAbsenceInput & { id: string }) => {
      const { data } = await api.patch<{ data: Absence }>(
        `/me/absences/${id}`,
        input,
      );
      return data.data;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["absences"] }),
  });
}

export function useDeleteMyAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/me/absences/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["absences"] }),
  });
}

export function useUpdateAbsenceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AbsenceStatus;
    }) => {
      const { data } = await api.patch<{ data: Absence }>(
        `/absences/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["absences"] }),
  });
}
