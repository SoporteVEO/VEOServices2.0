import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CurrentVersion, PatchNote } from "./patch-notes.types";

export const PATCH_NOTES_QUERY_KEY = ["patch-notes"] as const;

export function usePatchNotes() {
  return useQuery({
    queryKey: [...PATCH_NOTES_QUERY_KEY, "list"],
    queryFn: async () => {
      const response = await apiFetch<{ data: PatchNote[] }>("/patch-notes");
      return response.data;
    },
  });
}

export function useCurrentVersion() {
  return useQuery({
    queryKey: [...PATCH_NOTES_QUERY_KEY, "current-version"],
    queryFn: async () => {
      const response = await apiFetch<{ data: CurrentVersion }>(
        "/patch-notes/current-version",
      );
      return response.data.version;
    },
    staleTime: 5 * 60 * 1000,
  });
}
