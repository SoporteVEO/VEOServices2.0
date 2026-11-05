import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { HR_CATALOGS_QUERY_KEY } from "./hr-catalogs.get";
import type { HrCatalogEntry, HrCatalogKind } from "./hr-catalogs.types";

export function useCreateHrCatalogEntry(kind: HrCatalogKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<{ data: HrCatalogEntry }>(
        `/hr-catalogs/${kind}`,
        { name },
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...HR_CATALOGS_QUERY_KEY, kind] }),
  });
}
