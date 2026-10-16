import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  MaintenanceCategory,
  MaintenanceJob,
  MaintenanceJobKind,
  MaintenanceJobListItem,
  MaintenanceJobsQuery,
  MaintenanceOverview,
  MaintenancePerson,
} from "./maintenance.types";

const STALE_TIME = 30 * 1000;

export const maintenanceKeys = {
  all: ["maintenance"] as const,
  jobs: (query: MaintenanceJobsQuery) =>
    ["maintenance", "jobs", query] as const,
  job: (id: string | null) => ["maintenance", "job", id] as const,
  categories: (kind: MaintenanceJobKind, includeArchived: boolean) =>
    ["maintenance", "categories", kind, includeArchived] as const,
  technicians: (kind: MaintenanceJobKind) =>
    ["maintenance", "technicians", kind] as const,
  overview: (
    kind: MaintenanceJobKind,
    range: { from?: string; to?: string },
  ) => ["maintenance", "overview", kind, range] as const,
  portalJobs: ["maintenance-portal", "jobs"] as const,
  portalJob: (id: string | null) =>
    ["maintenance-portal", "job", id] as const,
};

interface PaginatedJobs {
  data: MaintenanceJobListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getMaintenanceJobs(
  query: MaintenanceJobsQuery,
): Promise<PaginatedJobs> {
  const params: Record<string, string> = { kind: query.kind };
  if (query.search) params.search = query.search;
  if (query.status) params.status = query.status;
  if (query.categoryId) params.categoryId = query.categoryId;
  if (query.assignedUserId) params.assignedUserId = query.assignedUserId;
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.pageSize = String(query.pageSize);

  return apiFetch<PaginatedJobs>("/maintenance/jobs", { query: params });
}

export function useMaintenanceJobs(query: MaintenanceJobsQuery) {
  return useQuery({
    queryKey: maintenanceKeys.jobs(query),
    queryFn: () => getMaintenanceJobs(query),
    staleTime: STALE_TIME,
  });
}

export async function getMaintenanceJob(id: string): Promise<MaintenanceJob> {
  const response = await apiFetch<{ data: MaintenanceJob }>(
    `/maintenance/jobs/${id}`,
  );
  return response.data;
}

export function useMaintenanceJob(id: string | null) {
  return useQuery({
    queryKey: maintenanceKeys.job(id),
    queryFn: () => getMaintenanceJob(id as string),
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}

export async function getMaintenanceCategories(
  kind: MaintenanceJobKind,
  includeArchived = false,
): Promise<MaintenanceCategory[]> {
  const query: Record<string, string> = { kind };
  if (includeArchived) query.includeArchived = "true";
  const response = await apiFetch<{ data: MaintenanceCategory[] }>(
    "/maintenance/categories",
    { query },
  );
  return response.data;
}

export function useMaintenanceCategories(
  kind: MaintenanceJobKind,
  includeArchived = false,
) {
  return useQuery({
    queryKey: maintenanceKeys.categories(kind, includeArchived),
    queryFn: () => getMaintenanceCategories(kind, includeArchived),
    staleTime: 5 * 60 * 1000,
  });
}

export async function getMaintenanceTechnicians(
  kind: MaintenanceJobKind,
): Promise<MaintenancePerson[]> {
  const response = await apiFetch<{ data: MaintenancePerson[] }>(
    "/maintenance/technicians",
    { query: { kind } },
  );
  return response.data;
}

export function useMaintenanceTechnicians(
  kind: MaintenanceJobKind,
  enabled = true,
) {
  return useQuery({
    queryKey: maintenanceKeys.technicians(kind),
    queryFn: () => getMaintenanceTechnicians(kind),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export async function getMaintenanceOverview(
  kind: MaintenanceJobKind,
  range: { from?: string; to?: string },
): Promise<MaintenanceOverview> {
  const query: Record<string, string> = { kind };
  if (range.from) query.from = range.from;
  if (range.to) query.to = range.to;
  const response = await apiFetch<{ data: MaintenanceOverview }>(
    "/maintenance/overview",
    { query },
  );
  return response.data;
}

export function useMaintenanceOverview(params: {
  kind: MaintenanceJobKind;
  from?: string;
  to?: string;
  enabled?: boolean;
}) {
  const range = { from: params.from, to: params.to };
  return useQuery({
    queryKey: maintenanceKeys.overview(params.kind, range),
    queryFn: () => getMaintenanceOverview(params.kind, range),
    enabled: params.enabled ?? true,
    staleTime: STALE_TIME,
  });
}

/* ---------------------------------------------------------------- portal */

export async function getMyMaintenanceJobs(): Promise<
  MaintenanceJobListItem[]
> {
  const response = await apiFetch<{ data: MaintenanceJobListItem[] }>(
    "/maintenance-portal/jobs",
  );
  return response.data;
}

export function useMyMaintenanceJobs({ enabled = true } = {}) {
  return useQuery({
    queryKey: maintenanceKeys.portalJobs,
    queryFn: getMyMaintenanceJobs,
    staleTime: STALE_TIME,
    enabled,
  });
}

export async function getMyMaintenanceJob(
  id: string,
): Promise<MaintenanceJob> {
  const response = await apiFetch<{ data: MaintenanceJob }>(
    `/maintenance-portal/jobs/${id}`,
  );
  return response.data;
}

export function useMyMaintenanceJob(id: string | null) {
  return useQuery({
    queryKey: maintenanceKeys.portalJob(id),
    queryFn: () => getMyMaintenanceJob(id as string),
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}
