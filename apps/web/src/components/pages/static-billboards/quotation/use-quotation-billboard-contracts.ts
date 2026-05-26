"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getBillboardContractHistory } from "@/api/billboards/billboards.get";
import {
  getContractRanges,
  type ContractRange,
} from "../detail/billboard-detail-utils";

const STALE_TIME = 5 * 60 * 1000;

export function useQuotationBillboardContractRanges(
  billboardIds: number[],
  enabled: boolean,
) {
  const sortedBillboardIds = useMemo(
    () => [...billboardIds].sort((a, b) => a - b),
    [billboardIds],
  );

  const queries = useQueries({
    queries: sortedBillboardIds.map((billboardId) => ({
      queryKey: ["billboards", "contracts", billboardId],
      queryFn: () => getBillboardContractHistory(billboardId),
      enabled: enabled && billboardId > 0,
      staleTime: STALE_TIME,
      gcTime: STALE_TIME * 2,
    })),
  });

  const contractRangesByBillboardId = useMemo(() => {
    const map = new Map<number, ContractRange[]>();
    sortedBillboardIds.forEach((billboardId, index) => {
      const query = queries[index];
      if (!query?.isFetched) return;
      map.set(billboardId, getContractRanges(query.data ?? []));
    });
    return map;
  }, [sortedBillboardIds, queries]);

  const isLoading = queries.some((query) => query.isLoading);
  const isContractsReady =
    !enabled ||
    sortedBillboardIds.length === 0 ||
    (queries.length === sortedBillboardIds.length &&
      sortedBillboardIds.every((billboardId) =>
        contractRangesByBillboardId.has(billboardId),
      ));

  return { contractRangesByBillboardId, isLoading, isContractsReady };
}
