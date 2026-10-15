import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PATCH_NOTES_QUERY_KEY } from "./patch-notes.get";
import type { PatchNote, PatchNoteInput } from "./patch-notes.types";

function useInvalidatePatchNotes() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: PATCH_NOTES_QUERY_KEY });
}

export function useCreatePatchNote() {
  const invalidate = useInvalidatePatchNotes();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PatchNoteInput) => {
      const response = await apiFetch<{ data: PatchNote }>("/patch-notes", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    onSuccess: async () => {
      await invalidate();
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "active"],
      });
    },
  });
}

export function useUpdatePatchNote() {
  const invalidate = useInvalidatePatchNotes();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<PatchNoteInput>;
    }) => {
      const response = await apiFetch<{ data: PatchNote }>(
        `/patch-notes/${id}`,
        { method: "PATCH", body: JSON.stringify(input) },
      );
      return response.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeletePatchNote() {
  const invalidate = useInvalidatePatchNotes();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/patch-notes/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
