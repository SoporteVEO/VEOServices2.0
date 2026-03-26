import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AvailableBillboard, AvailableState } from "./billboards.types";

export type { AvailableBillboard, AvailableState } from "./billboards.types";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

export async function getBillboardStates(params: { from: string; to: string }) {
  const response = await apiFetch<{ data: AvailableState[] }>(
    "/billboards/states",
    { query: { from: params.from, to: params.to } },
  );
  return response.data;
}

export function useBillboardStates(params: {
  from: string;
  to: string;
  enabled?: boolean;
}) {
  const { from, to, enabled = true } = params;
  return useQuery({
    queryKey: ["billboards", "states", from, to],
    queryFn: () => getBillboardStates({ from, to }),
    enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getAvailableBillboards(params: {
  departmentId: number;
  from: string;
  to: string;
}) {
  const response = await apiFetch<{ data: AvailableBillboard[] }>(
    "/billboards",
    {
      query: {
        departmentId: String(params.departmentId),
        from: params.from,
        to: params.to,
      },
    },
  );
  return response.data;
}

export function useAvailableBillboards(params: {
  departmentId: number | null;
  from: string;
  to: string;
  enabled?: boolean;
}) {
  const { departmentId, from, to, enabled = true } = params;
  return useQuery({
    queryKey: ["billboards", departmentId, from, to],
    queryFn: () =>
      getAvailableBillboards({
        departmentId: departmentId!,
        from,
        to,
      }),
    enabled: enabled && departmentId != null,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}
