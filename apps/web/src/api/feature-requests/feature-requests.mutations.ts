import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { uploadBlobToPresignedUrl } from "@/lib/upload-blob-to-presigned-url";
import {
  ATTACHMENT_MIME_TYPES,
  attachmentExtension,
} from "./feature-requests.const";
import { FEATURE_REQUESTS_QUERY_KEY } from "./feature-requests.get";
import type {
  CreateFeatureRequestInput,
  FeatureRequestDetail,
  UpdateFeatureRequestInput,
  UpdateFeatureRequestStatusInput,
} from "./feature-requests.types";

const PDF_MIME_TYPE = "application/pdf";

/** Every action answers with the refreshed request, so the drawer updates without a refetch. */
function useApplyDetail() {
  const queryClient = useQueryClient();
  return async (detail: FeatureRequestDetail) => {
    queryClient.setQueryData(
      [...FEATURE_REQUESTS_QUERY_KEY, "detail", detail.id],
      detail,
    );
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [...FEATURE_REQUESTS_QUERY_KEY, "mine"],
      }),
      queryClient.invalidateQueries({
        queryKey: [...FEATURE_REQUESTS_QUERY_KEY, "dev"],
      }),
    ]);
  };
}

async function uploadRequestPdf(file: File): Promise<string> {
  const upload = await apiFetch<{ data: { key: string; url: string } }>(
    "/feature-requests/upload-url",
    { method: "POST" },
  );
  await uploadBlobToPresignedUrl({
    url: upload.data.url,
    blob: file,
    contentType: PDF_MIME_TYPE,
  });
  return upload.data.key;
}

/** Uploads the PDF straight to S3, then files the request that points to it. */
async function createFeatureRequest(
  input: CreateFeatureRequestInput,
): Promise<FeatureRequestDetail> {
  const { file, attachments, ...fields } = input;
  const fileKey = await uploadRequestPdf(file);
  const uploadedAttachments = await Promise.all(
    attachments.map(uploadAttachment),
  );
  const response = await apiFetch<{ data: FeatureRequestDetail }>(
    "/feature-requests",
    {
      method: "POST",
      body: JSON.stringify({
        ...fields,
        fileKey,
        fileName: file.name,
        attachments: uploadedAttachments,
      }),
    },
  );
  return response.data;
}

async function uploadAttachment(file: File) {
  const extension = attachmentExtension(file.name);
  if (!extension) throw new Error(`Formato no permitido: ${file.name}`);
  const upload = await apiFetch<{ data: { key: string; url: string } }>(
    "/feature-requests/attachment-upload-url",
    { method: "POST", body: JSON.stringify({ fileName: file.name }) },
  );
  await uploadBlobToPresignedUrl({
    url: upload.data.url,
    blob: file,
    contentType: ATTACHMENT_MIME_TYPES[extension],
  });
  return { key: upload.data.key, fileName: file.name };
}

async function updateFeatureRequest(
  requestId: string,
  { file, attachments, ...fields }: UpdateFeatureRequestInput,
): Promise<FeatureRequestDetail> {
  const fileFields = file
    ? { fileKey: await uploadRequestPdf(file), fileName: file.name }
    : {};
  const uploadedAttachments = await Promise.all(
    attachments.map(uploadAttachment),
  );
  const response = await apiFetch<{ data: FeatureRequestDetail }>(
    `/development/feature-requests/${requestId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ...fields,
        ...fileFields,
        attachments: uploadedAttachments,
      }),
    },
  );
  return response.data;
}

export function useUpdateFeatureRequest(requestId: string) {
  const applyDetail = useApplyDetail();
  return useMutation({
    mutationFn: (input: UpdateFeatureRequestInput) =>
      updateFeatureRequest(requestId, input),
    onSuccess: applyDetail,
  });
}

export function useCreateFeatureRequest() {
  const applyDetail = useApplyDetail();
  return useMutation({
    mutationFn: createFeatureRequest,
    onSuccess: applyDetail,
  });
}

export function useAddFeatureRequestCollaborator(requestId: string) {
  const applyDetail = useApplyDetail();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiFetch<{ data: FeatureRequestDetail }>(
        `/feature-requests/${requestId}/collaborators`,
        { method: "POST", body: JSON.stringify({ userId }) },
      );
      return response.data;
    },
    onSuccess: applyDetail,
  });
}

export function useRemoveFeatureRequestCollaborator(requestId: string) {
  const applyDetail = useApplyDetail();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiFetch<{ data: FeatureRequestDetail }>(
        `/feature-requests/${requestId}/collaborators/${userId}`,
        { method: "DELETE" },
      );
      return response.data;
    },
    onSuccess: applyDetail,
  });
}

export function useSignFeatureRequest(requestId: string) {
  const applyDetail = useApplyDetail();
  return useMutation({
    mutationFn: async (signatureImage: string) => {
      const response = await apiFetch<{ data: FeatureRequestDetail }>(
        `/feature-requests/${requestId}/signature`,
        {
          method: "POST",
          body: JSON.stringify({ signatureImage, accepted: true }),
        },
      );
      return response.data;
    },
    onSuccess: applyDetail,
  });
}

export function useReportFeatureRequestProblem(requestId: string) {
  const applyDetail = useApplyDetail();
  return useMutation({
    mutationFn: async (message: string) => {
      const response = await apiFetch<{ data: FeatureRequestDetail }>(
        `/feature-requests/${requestId}/report-problem`,
        { method: "POST", body: JSON.stringify({ message }) },
      );
      return response.data;
    },
    onSuccess: applyDetail,
  });
}

export function useUpdateFeatureRequestStatus(requestId: string) {
  const applyDetail = useApplyDetail();
  return useMutation({
    mutationFn: async (input: UpdateFeatureRequestStatusInput) => {
      const response = await apiFetch<{ data: FeatureRequestDetail }>(
        `/development/feature-requests/${requestId}/status`,
        { method: "PATCH", body: JSON.stringify(input) },
      );
      return response.data;
    },
    onSuccess: applyDetail,
  });
}
