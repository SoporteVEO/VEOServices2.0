import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  MaintenanceCategory,
  MaintenanceJob,
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
  categories: (includeArchived: boolean) =>
    ["maintenance", "categories", includeArchived] as const,
  technicians: ["maintenance", "technicians"] as const,
  overview: (range: { from?: string; to?: string }) =>
    ["maintenance", "overview", range] as const,
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
  const params: Record<string, string> = {};
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
  includeArchived = false,
): Promise<MaintenanceCategory[]> {
  const response = await apiFetch<{ data: MaintenanceCategory[] }>(
    "/maintenance/categories",
    { query: includeArchived ? { includeArchived: "true" } : undefined },
  );
  return response.data;
}

export function useMaintenanceCategories(includeArchived = false) {
  return useQuery({
    queryKey: maintenanceKeys.categories(includeArchived),
    queryFn: () => getMaintenanceCategories(includeArchived),
    staleTime: 5 * 60 * 1000,
  });
}

export async function getMaintenanceTechnicians(): Promise<
  MaintenancePerson[]
> {
  const response = await apiFetch<{ data: MaintenancePerson[] }>(
    "/maintenance/technicians",
  );
  return response.data;
}

export function useMaintenanceTechnicians(enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.technicians,
    queryFn: getMaintenanceTechnicians,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export async function getMaintenanceOverview(range: {
  from?: string;
  to?: string;
}): Promise<MaintenanceOverview> {
  const query: Record<string, string> = {};
  if (range.from) query.from = range.from;
  if (range.to) query.to = range.to;
  const response = await apiFetch<{ data: MaintenanceOverview }>(
    "/maintenance/overview",
    { query },
  );
  return response.data;
}

export function useMaintenanceOverview(range: {
  from?: string;
  to?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: maintenanceKeys.overview({ from: range.from, to: range.to }),
    queryFn: () => getMaintenanceOverview({ from: range.from, to: range.to }),
    enabled: range.enabled ?? true,
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

export function useMyMaintenanceJobs() {
  return useQuery({
    queryKey: maintenanceKeys.portalJobs,
    queryFn: getMyMaintenanceJobs,
    staleTime: STALE_TIME,
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
