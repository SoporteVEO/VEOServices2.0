import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  AcademyArticle,
  AcademyIndex,
  AcademySearchResult,
} from "./academy.types";

export type * from "./academy.types";

export async function getAcademyIndex(): Promise<AcademyIndex> {
  const response = await apiFetch<{ data: AcademyIndex }>("/academy");
  return response.data;
}

export function useAcademyIndex() {
  return useQuery({
    queryKey: ["academy", "index"],
    queryFn: getAcademyIndex,
    staleTime: Infinity,
  });
}

export async function getAcademyArticle(slug: string): Promise<AcademyArticle> {
  const response = await apiFetch<{ data: AcademyArticle }>(
    `/academy/${encodeURIComponent(slug)}`,
  );
  return response.data;
}

export function useAcademyArticle(slug: string) {
  return useQuery({
    queryKey: ["academy", "article", slug],
    queryFn: () => getAcademyArticle(slug),
    staleTime: Infinity,
  });
}

export async function searchAcademy(q: string): Promise<AcademySearchResult[]> {
  const response = await apiFetch<{ data: AcademySearchResult[] }>(
    "/academy/search",
    { query: { q } },
  );
  return response.data;
}

export function useAcademySearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: ["academy", "search", query],
    queryFn: () => searchAcademy(query),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
}
