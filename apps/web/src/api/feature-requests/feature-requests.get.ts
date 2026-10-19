import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  FeatureRequestDetail,
  FeatureRequestListItem,
  FeatureRequestPriority,
  FeatureRequestStatus,
  FeatureRequestUser,
  PaginatedFeatureRequests,
} from "./feature-requests.types";

export const FEATURE_REQUESTS_QUERY_KEY = ["feature-requests"] as const;

export function useMyFeatureRequests() {
  return useQuery({
    queryKey: [...FEATURE_REQUESTS_QUERY_KEY, "mine"],
    queryFn: async () => {
      const response = await apiFetch<{ data: FeatureRequestListItem[] }>(
        "/feature-requests",
      );
      return response.data;
    },
  });
}

export function useFeatureRequest(id: string | null) {
  return useQuery({
    queryKey: [...FEATURE_REQUESTS_QUERY_KEY, "detail", id],
    queryFn: async () => {
      const response = await apiFetch<{ data: FeatureRequestDetail }>(
        `/feature-requests/${id}`,
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCollaboratorOptions(enabled = true) {
  return useQuery({
    queryKey: [...FEATURE_REQUESTS_QUERY_KEY, "collaborator-options"],
    queryFn: async () => {
      const response = await apiFetch<{ data: FeatureRequestUser[] }>(
        "/feature-requests/collaborator-options",
      );
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export interface ListDevFeatureRequestsQuery {
  status?: FeatureRequestStatus;
  priority?: FeatureRequestPriority;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useDevFeatureRequests(query: ListDevFeatureRequestsQuery) {
  return useQuery({
    queryKey: [...FEATURE_REQUESTS_QUERY_KEY, "dev", query],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (query.status) params.status = query.status;
      if (query.priority) params.priority = query.priority;
      if (query.search) params.search = query.search;
      if (query.page) params.page = String(query.page);
      if (query.pageSize) params.pageSize = String(query.pageSize);
      return apiFetch<PaginatedFeatureRequests>(
        "/development/feature-requests",
        { query: params },
      );
    },
    placeholderData: keepPreviousData,
  });
}

export async function getFeatureRequestAttachmentUrl(
  id: string,
  download: boolean,
): Promise<string> {
  const response = await apiFetch<{ url: string }>(
    `/feature-requests/${id}/attachment-url`,
    { query: download ? { download: "true" } : {} },
  );
  return response.url;
}
