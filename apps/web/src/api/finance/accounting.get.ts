import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  FINANCE_CATALOG_STALE_TIME,
  FINANCE_STALE_TIME,
  toQueryParams,
} from "./finance-query";
import type {
  CatalogQuery,
  CentroCosto,
  CuentaConta,
  EntriesQuery,
  FinancePage,
  Partida,
  PartidaDetail,
  TipoPartida,
} from "./finance.types";

const BASE = "/finance/accounting";

export const accountingKeys = {
  all: ["finance", "accounting"] as const,
  accounts: (query: CatalogQuery) =>
    ["finance", "accounting", "accounts", query] as const,
  costCenters: (query: CatalogQuery) =>
    ["finance", "accounting", "cost-centers", query] as const,
  entryTypes: ["finance", "accounting", "entry-types"] as const,
  entries: (query: EntriesQuery) =>
    ["finance", "accounting", "entries", query] as const,
  entry: (mpaId: number | null) =>
    ["finance", "accounting", "entry", mpaId] as const,
};

export function useAccounts(query: CatalogQuery) {
  return useQuery({
    queryKey: accountingKeys.accounts(query),
    queryFn: () =>
      apiFetch<FinancePage<CuentaConta>>(`${BASE}/accounts`, {
        query: toQueryParams(query),
      }),
    staleTime: FINANCE_CATALOG_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useCostCenters(query: CatalogQuery) {
  return useQuery({
    queryKey: accountingKeys.costCenters(query),
    queryFn: () =>
      apiFetch<FinancePage<CentroCosto>>(`${BASE}/cost-centers`, {
        query: toQueryParams(query),
      }),
    staleTime: FINANCE_CATALOG_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useEntryTypes() {
  return useQuery({
    queryKey: accountingKeys.entryTypes,
    queryFn: async () => {
      const response = await apiFetch<{ data: TipoPartida[] }>(
        `${BASE}/entry-types`,
      );
      return response.data;
    },
    staleTime: FINANCE_CATALOG_STALE_TIME,
  });
}

export function useEntries(query: EntriesQuery) {
  return useQuery({
    queryKey: accountingKeys.entries(query),
    queryFn: () =>
      apiFetch<FinancePage<Partida>>(`${BASE}/entries`, {
        query: toQueryParams(query),
      }),
    staleTime: FINANCE_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useEntry(mpaId: number | null) {
  return useQuery({
    queryKey: accountingKeys.entry(mpaId),
    queryFn: async () => {
      const response = await apiFetch<{ data: PartidaDetail }>(
        `${BASE}/entries/${mpaId}`,
      );
      return response.data;
    },
    enabled: mpaId != null,
    staleTime: FINANCE_STALE_TIME,
  });
}
