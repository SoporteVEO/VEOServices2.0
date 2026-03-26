import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface DigitalBillboard {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  imageThumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  maxSpots: number;
}

/** Single record from GET /digital-billboards/:id (includes image relation). */
export interface DigitalBillboardDetail {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  maxSpots: number;
  imageId: string | null;
  createdAt: string;
  updatedAt: string;
  departmentId?: number | null;
  departmentName?: string | null;
  image?: {
    id: string;
    completeUrl: string;
    thumbnailUrl: string;
    mediumUrl: string;
    deleteUrl: string | null;
  } | null;
}

export async function getDigitalBillboards() {
  const response =
    await apiFetch<{ data: DigitalBillboard[] }>("/digital-billboards");
  return response.data;
}

export function useDigitalBillboards() {
  const { data, isLoading } = useQuery({
    queryKey: ["digital-billboards"],
    queryFn: getDigitalBillboards,
  });

  return { data, isLoading };
}

export async function getDigitalBillboard(id: string) {
  return apiFetch<DigitalBillboardDetail>(`/digital-billboards/${id}`);
}

export function useDigitalBillboardById(id: string | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["digital-billboards", id],
    queryFn: () => getDigitalBillboard(id!),
    enabled: !!id,
  });

  return { data, isLoading, isError };
}
