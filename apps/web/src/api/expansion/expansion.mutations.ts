import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { uploadBlobToPresignedUrl } from "@/lib/upload-blob-to-presigned-url";
import { expansionKeys } from "./expansion.get";
import type {
  ExpansionNexoInsight,
  ExpansionNexoInsightInput,
  ExpansionSite,
  ExpansionSiteDetail,
  ExpansionSiteInput,
} from "./expansion.types";

type QueryClient = ReturnType<typeof useQueryClient>;

/** Site mutations answer with the refreshed site, so the drawer updates without a refetch. */
function syncSite(queryClient: QueryClient, site: ExpansionSiteDetail) {
  queryClient.setQueryData(expansionKeys.site(site.id), site);
  void queryClient.invalidateQueries({ queryKey: expansionKeys.sites });
}

export function useCreateExpansionSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExpansionSiteInput) => {
      const response = await apiFetch<{ data: ExpansionSiteDetail }>("/expansion/sites", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    onSuccess: (site) => syncSite(queryClient, site),
  });
}

export function useUpdateExpansionSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<ExpansionSiteInput>) => {
      const response = await apiFetch<{ data: ExpansionSiteDetail }>(`/expansion/sites/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    onSuccess: (site) => syncSite(queryClient, site),
  });
}

/** Drag-to-move: the pin stays where it was dropped, and snaps back if the save fails. */
export function useMoveExpansionSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; latitude: number; longitude: number }) => {
      const { id, ...body } = input;
      const response = await apiFetch<{ data: ExpansionSiteDetail }>(`/expansion/sites/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return response.data;
    },
    onMutate: async ({ id, latitude, longitude }) => {
      await queryClient.cancelQueries({ queryKey: expansionKeys.sites });
      const previous = queryClient.getQueryData<ExpansionSite[]>(expansionKeys.sites);
      queryClient.setQueryData<ExpansionSite[]>(expansionKeys.sites, (sites) =>
        sites?.map((site) => (site.id === id ? { ...site, latitude, longitude } : site)),
      );
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) queryClient.setQueryData(expansionKeys.sites, context.previous);
    },
    onSuccess: (site) => syncSite(queryClient, site),
  });
}

export function useDeleteExpansionSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/expansion/sites/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: expansionKeys.site(id) });
      void queryClient.invalidateQueries({ queryKey: expansionKeys.sites });
    },
  });
}

export function useAddExpansionComment(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const response = await apiFetch<{ data: ExpansionSiteDetail }>(
        `/expansion/sites/${siteId}/comments`,
        { method: "POST", body: JSON.stringify({ body }) },
      );
      return response.data;
    },
    onSuccess: (site) => syncSite(queryClient, site),
  });
}

/** Uploads the file straight to S3, then attaches it to the site. */
export function useUploadExpansionDocument(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, mimeType }: { file: File; mimeType: string }) => {
      const upload = await apiFetch<{ data: { key: string; url: string } }>(
        `/expansion/sites/${siteId}/documents/upload-url`,
        { method: "POST", body: JSON.stringify({ mimeType }) },
      );
      await uploadBlobToPresignedUrl({
        url: upload.data.url,
        blob: file,
        contentType: mimeType,
      });
      const response = await apiFetch<{ data: ExpansionSiteDetail }>(
        `/expansion/sites/${siteId}/documents`,
        {
          method: "POST",
          body: JSON.stringify({ fileKey: upload.data.key, fileName: file.name, mimeType }),
        },
      );
      return response.data;
    },
    onSuccess: (site) => syncSite(queryClient, site),
  });
}

export function useDeleteExpansionDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiFetch<{ data: ExpansionSiteDetail }>(
        `/expansion/documents/${documentId}`,
        { method: "DELETE" },
      );
      return response.data;
    },
    onSuccess: (site) => syncSite(queryClient, site),
  });
}

export function useRefreshSiteContext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (siteId: string) => {
      const response = await apiFetch<{ data: ExpansionSiteDetail }>(
        `/expansion/sites/${siteId}/context`,
        { method: "POST" },
      );
      return response.data;
    },
    onSuccess: (site) => syncSite(queryClient, site),
  });
}

export function useExpansionNexoInsight() {
  return useMutation({
    mutationFn: async (input: ExpansionNexoInsightInput) => {
      const response = await apiFetch<{ data: ExpansionNexoInsight }>(
        "/expansion/nexo-insight",
        { method: "POST", body: JSON.stringify(input) },
      );
      return response.data;
    },
  });
}

export function useUpdateBillboardCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      billboardId: number;
      monthlyCost: number | null;
      notes?: string | null;
    }) => {
      const { billboardId, ...body } = input;
      return apiFetch<{ data: { billboardId: number; monthlyCost: number | null } }>(
        `/expansion/billboards/${billboardId}/cost`,
        { method: "PUT", body: JSON.stringify(body) },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expansion", "billboards"] });
      void queryClient.invalidateQueries({ queryKey: ["expansion", "billboard"] });
    },
  });
}
