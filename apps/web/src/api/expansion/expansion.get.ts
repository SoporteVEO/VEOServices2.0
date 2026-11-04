import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ExpansionBillboardDetail,
  ExpansionBillboardsResult,
  ExpansionSite,
  ExpansionSiteDetail,
  LocationContext,
} from "./expansion.types";

const STALE_TIME = 60 * 1000;

export const expansionKeys = {
  all: ["expansion"] as const,
  billboards: (year: number | null) => ["expansion", "billboards", year] as const,
  billboard: (billboardId: number | null, year: number | null) =>
    ["expansion", "billboard", billboardId, year] as const,
  sites: ["expansion", "sites"] as const,
  site: (id: string | null) => ["expansion", "site", id] as const,
  locationContext: (latitude: string | null, longitude: string | null) =>
    ["expansion", "location-context", latitude, longitude] as const,
};

function periodQuery(year: number | null): Record<string, string> | undefined {
  return year != null ? { year: String(year) } : undefined;
}

export function useExpansionBillboards(year: number | null) {
  return useQuery({
    queryKey: expansionKeys.billboards(year),
    queryFn: async () => {
      const response = await apiFetch<{ data: ExpansionBillboardsResult }>(
        "/expansion/billboards",
        { query: periodQuery(year) },
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useExpansionBillboard(billboardId: number | null, year: number | null) {
  return useQuery({
    queryKey: expansionKeys.billboard(billboardId, year),
    queryFn: async () => {
      const response = await apiFetch<{ data: ExpansionBillboardDetail }>(
        `/expansion/billboards/${billboardId}`,
        { query: periodQuery(year) },
      );
      return response.data;
    },
    enabled: billboardId != null,
    staleTime: STALE_TIME,
  });
}

export function useExpansionSites() {
  return useQuery({
    queryKey: expansionKeys.sites,
    queryFn: async () => {
      const response = await apiFetch<{ data: ExpansionSite[] }>("/expansion/sites");
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

export function useExpansionSite(id: string | null) {
  return useQuery({
    queryKey: expansionKeys.site(id),
    queryFn: async () => {
      const response = await apiFetch<{ data: ExpansionSiteDetail }>(
        `/expansion/sites/${id}`,
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}

/** Surroundings of a point that is not saved yet; saved sites carry theirs. */
export function useLocationContext(point: { latitude: number; longitude: number } | null) {
  const latitude = point ? point.latitude.toFixed(5) : null;
  const longitude = point ? point.longitude.toFixed(5) : null;
  return useQuery({
    queryKey: expansionKeys.locationContext(latitude, longitude),
    queryFn: async () => {
      const response = await apiFetch<{ data: LocationContext | null }>(
        "/expansion/location-context",
        { query: { latitude: latitude!, longitude: longitude! } },
      );
      return response.data;
    },
    enabled: latitude != null && longitude != null,
    staleTime: Infinity,
    retry: 1,
  });
}

export async function getExpansionDocumentUrl(
  documentId: string,
  download: boolean,
): Promise<string> {
  const response = await apiFetch<{ url: string }>(
    `/expansion/documents/${documentId}/url`,
    { query: download ? { download: "true" } : undefined },
  );
  return response.url;
}
