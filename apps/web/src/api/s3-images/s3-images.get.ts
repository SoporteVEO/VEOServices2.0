import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type S3ImageType =
  | "STATIC_BILLBOARD_MONTHLY"
  | "STATIC_BILLBOARD_MAINTENANCE"
  | "STATIC_BILLBOARD_INSTALLATION";

export const S3_IMAGE_TYPE_OPTIONS: { value: S3ImageType; label: string }[] = [
  { value: "STATIC_BILLBOARD_MONTHLY", label: "Imagen de valla mensual" },
  {
    value: "STATIC_BILLBOARD_INSTALLATION",
    label: "Imagen de instalacion de valla",
  },
  {
    value: "STATIC_BILLBOARD_MAINTENANCE",
    label: "Imagen de mantenimiento de valla",
  },
];
export type SortOrder = "asc" | "desc";

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

export interface S3ImageUploader {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export interface PaginatedS3Images {
  data: S3Image[];
  nextCursor: string | null;
}

export interface ListS3ImagesQuery {
  type?: S3ImageType;
  staticBillboardCodeId?: string;
  code?: string;
  uploadedUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: SortOrder;
  limit?: number;
}

function buildParams(
  query: ListS3ImagesQuery,
  cursor: string | undefined,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.type) params.type = query.type;
  if (query.staticBillboardCodeId)
    params.staticBillboardCodeId = query.staticBillboardCodeId;
  if (query.code) params.code = query.code;
  if (query.uploadedUserId) params.uploadedUserId = query.uploadedUserId;
  if (query.dateFrom) params.dateFrom = query.dateFrom;
  if (query.dateTo) params.dateTo = query.dateTo;
  if (query.sortOrder) params.sortOrder = query.sortOrder;
  if (query.limit) params.limit = String(query.limit);
  if (cursor) params.cursor = cursor;
  return params;
}

export async function getS3ImagesPage(
  query: ListS3ImagesQuery,
  cursor?: string,
): Promise<PaginatedS3Images> {
  return apiFetch<PaginatedS3Images>("/s3-images", {
    method: "GET",
    query: buildParams(query, cursor),
  });
}

export function useS3Images(query: ListS3ImagesQuery = {}) {
  return useInfiniteQuery({
    queryKey: ["s3-images", "list", query],
    queryFn: ({ pageParam }) => getS3ImagesPage(query, pageParam ?? undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export async function getS3ImageUploaders() {
  const response = await apiFetch<{ data: S3ImageUploader[] }>(
    "/s3-images/uploaders",
  );
  return response.data;
}

export function useS3ImageUploaders() {
  return useQuery({
    queryKey: ["s3-images", "uploaders"],
    queryFn: getS3ImageUploaders,
  });
}
