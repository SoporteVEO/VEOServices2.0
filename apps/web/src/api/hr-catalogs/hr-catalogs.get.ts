import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { HrCatalogEntry, HrCatalogKind } from "./hr-catalogs.types";

export const HR_CATALOGS_QUERY_KEY = ["hr-catalogs"] as const;

export function useHrCatalog(kind: HrCatalogKind) {
  return useQuery({
    queryKey: [...HR_CATALOGS_QUERY_KEY, kind],
    queryFn: async () => {
      const response = await apiFetch<{ data: HrCatalogEntry[] }>(
        `/hr-catalogs/${kind}`,
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
