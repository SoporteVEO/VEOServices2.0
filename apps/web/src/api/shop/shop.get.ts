import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DigitalSpotOption } from "@/lib/digital-spots";
import type { AvailableState } from "@/api/billboards/billboards.types";
import type { AvailableDigitalBillboard } from "./shop.types";

export type { AvailableDigitalBillboard } from "./shop.types";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

export async function getDigitalShopDepartments() {
  const response = await apiFetch<{ data: AvailableState[] }>(
    "/shop/digital-departments",
  );
  return response.data;
}

export function useDigitalShopDepartments(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ["shop", "digital-departments"],
    queryFn: getDigitalShopDepartments,
    enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getShopDigitalBillboards(params: {
  departmentId: number | null;
  from: string;
  to: string;
  spots: DigitalSpotOption;
}) {
  const query: Record<string, string> = {
    from: params.from,
    to: params.to,
    spots: String(params.spots),
  };
  if (params.departmentId != null) {
    query.departmentId = String(params.departmentId);
  }
  const response = await apiFetch<{ data: AvailableDigitalBillboard[] }>(
    "/shop/digital-billboards",
    { query },
  );
  return response.data;
}

export function useShopDigitalBillboards(params: {
  departmentId: number | null;
  from: string;
  to: string;
  spots: DigitalSpotOption;
  enabled?: boolean;
}) {
  const { departmentId, from, to, spots, enabled = true } = params;
  return useQuery({
    queryKey: ["shop", "digital-billboards", departmentId, from, to, spots],
    queryFn: () =>
      getShopDigitalBillboards({ departmentId, from, to, spots }),
    enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}
