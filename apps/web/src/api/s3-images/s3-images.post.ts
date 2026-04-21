import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { S3Image, S3ImageType } from "./s3-images.get";

export interface CreateS3ImageInput {
  imageBase64: string;
  type: S3ImageType;
  staticBillboardCodeId?: string | null;
  tags?: string[];
}

export async function createS3Image(input: CreateS3ImageInput) {
  const response = await apiFetch<{ data: S3Image }>("/s3-images", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export function useCreateS3Image(options?: {
  onSuccess?: (created: S3Image) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createS3Image,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["s3-images"] });
      options?.onSuccess?.(created);
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}

export async function deleteS3Image(id: string) {
  return apiFetch(`/s3-images/${id}`, { method: "DELETE" });
}

export function useDeleteS3Image(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteS3Image,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["s3-images"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
    },
  });
}
