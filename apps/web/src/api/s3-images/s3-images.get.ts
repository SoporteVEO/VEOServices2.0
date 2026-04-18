import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type S3ImageType = "STATIC_BILLBOARD_MONTHLY";

export interface S3Image {
  id: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  uploadedUserId: string;
  uploadedUser: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
  tags: string[];
  type: S3ImageType;
  staticBillboardCodeId: string | null;
  staticBillboardCode: {
    id: string;
    code: string;
  } | null;
}

export interface ListS3ImagesQuery {
  type?: S3ImageType;
  staticBillboardCodeId?: string;
}

export async function getS3Images(query: ListS3ImagesQuery = {}) {
  const params: Record<string, string> = {};
  if (query.type) params.type = query.type;
  if (query.staticBillboardCodeId)
    params.staticBillboardCodeId = query.staticBillboardCodeId;

  const response = await apiFetch<{ data: S3Image[] }>("/s3-images", {
    method: "GET",
    query: params,
  });
  return response.data;
}

export function useS3Images(query: ListS3ImagesQuery = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ["s3-images", query],
    queryFn: () => getS3Images(query),
  });

  return { data, isLoading };
}
