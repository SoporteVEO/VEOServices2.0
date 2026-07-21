import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { BriloCatalogos } from "./brilo-webapi.types";

export async function getBriloCatalogos(): Promise<BriloCatalogos> {
  return apiFetch<BriloCatalogos>("/brilo-webapi/catalogos", {
    method: "GET",
  });
}

export function useBriloCatalogos() {
  return useQuery({
    queryKey: ["brilo-webapi", "catalogos"],
    queryFn: getBriloCatalogos,
    staleTime: 5 * 60 * 1000,
  });
}
