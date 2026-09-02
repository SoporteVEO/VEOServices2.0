import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { maintenanceKeys } from "./maintenance.get";
import type {
  CreateMaintenanceJobInput,
  MaintenanceCategory,
  MaintenanceJob,
  UpdateMaintenanceJobInput,
} from "./maintenance.types";

type QueryClient = ReturnType<typeof useQueryClient>;

/**
 * Every job mutation returns the refreshed job, so we seed both detail caches
 * and invalidate the lists and stats that summarise it.
 */
function syncJobCaches(queryClient: QueryClient, job: MaintenanceJob) {
  queryClient.setQueryData(maintenanceKeys.job(job.id), job);
  queryClient.setQueryData(maintenanceKeys.portalJob(job.id), job);
  void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
  void queryClient.invalidateQueries({ queryKey: maintenanceKeys.portalJobs });
}

function invalidateCategories(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["maintenance"] });
}

export function useCreateMaintenanceJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMaintenanceJobInput) => {
      const response = await apiFetch<{ data: MaintenanceJob }>(
        "/maintenance/jobs",
        { method: "POST", body: JSON.stringify(input) },
      );
      return response.data;
    },
    onSuccess: (job) => syncJobCaches(queryClient, job),
  });
}

export function useUpdateMaintenanceJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: { id: string } & UpdateMaintenanceJobInput,
    ) => {
      const { id, ...body } = input;
      const response = await apiFetch<{ data: MaintenanceJob }>(
        `/maintenance/jobs/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      return response.data;
    },
    onSuccess: (job) => syncJobCaches(queryClient, job),
  });
}

export function useCancelMaintenanceJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string }) => {
      const response = await apiFetch<{ data: MaintenanceJob }>(
        `/maintenance/jobs/${input.id}/cancel`,
        { method: "PATCH" },
      );
      return response.data;
    },
    onSuccess: (job) => syncJobCaches(queryClient, job),
  });
}

export function useReopenMaintenanceJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string }) => {
      const response = await apiFetch<{ data: MaintenanceJob }>(
        `/maintenance/jobs/${input.id}/reopen`,
        { method: "PATCH" },
      );
      return response.data;
    },
    onSuccess: (job) => syncJobCaches(queryClient, job),
  });
}

export function usePublishMaintenancePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { photoId: string }) => {
      const response = await apiFetch<{ data: MaintenanceJob }>(
        `/maintenance/photos/${input.photoId}/publish`,
        { method: "POST" },
      );
      return response.data;
    },
    onSuccess: (job) => {
      syncJobCaches(queryClient, job);
      void queryClient.invalidateQueries({ queryKey: ["s3-images"] });
    },
  });
}

export function useDeleteMaintenancePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { photoId: string }) => {
      const response = await apiFetch<{ data: MaintenanceJob }>(
        `/maintenance/photos/${input.photoId}`,
        { method: "DELETE" },
      );
      return response.data;
    },
    onSuccess: (job) => syncJobCaches(queryClient, job),
  });
}

/* ------------------------------------------------------------ categories */

export function useCreateMaintenanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color?: string }) => {
      const response = await apiFetch<{ data: MaintenanceCategory }>(
        "/maintenance/categories",
        { method: "POST", body: JSON.stringify(input) },
      );
      return response.data;
    },
    onSuccess: () => invalidateCategories(queryClient),
  });
}

export function useUpdateMaintenanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      color?: string;
      archived?: boolean;
    }) => {
      const { id, ...body } = input;
      const response = await apiFetch<{ data: MaintenanceCategory }>(
        `/maintenance/categories/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      return response.data;
    },
    onSuccess: () => invalidateCategories(queryClient),
  });
}

export function useDeleteMaintenanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) =>
      apiFetch<{ deleted: boolean }>(`/maintenance/categories/${input.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => invalidateCategories(queryClient),
  });
}

/* ---------------------------------------------------------------- portal */

export function useStartMaintenanceJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string }) => {
      const response = await apiFetch<{ data: MaintenanceJob }>(
        `/maintenance-portal/jobs/${input.id}/start`,
        { method: "PATCH" },
      );
      return response.data;
    },
    onSuccess: (job) => syncJobCaches(queryClient, job),
  });
}

export function useCompleteMaintenanceJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; completionNotes?: string }) => {
      const response = await apiFetch<{ data: MaintenanceJob }>(
        `/maintenance-portal/jobs/${input.id}/complete`,
        {
          method: "PATCH",
          body: JSON.stringify({ completionNotes: input.completionNotes }),
        },
      );
      return response.data;
    },
    onSuccess: (job) => syncJobCaches(queryClient, job),
  });
}

export function useUploadMaintenancePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      imageBase64: string;
      note?: string;
    }) => {
      const response = await apiFetch<{ data: MaintenanceJob }>(
        `/maintenance-portal/jobs/${input.id}/photos`,
        {
          method: "POST",
          body: JSON.stringify({
            imageBase64: input.imageBase64,
            note: input.note,
          }),
        },
      );
      return response.data;
    },
    onSuccess: (job) => syncJobCaches(queryClient, job),
  });
}
