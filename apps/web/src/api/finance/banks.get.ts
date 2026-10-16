import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  FINANCE_CATALOG_STALE_TIME,
  FINANCE_STALE_TIME,
  toQueryParams,
} from "./finance-query";
import type {
  AbonoBanco,
  BankCatalogs,
  BankMovementsQuery,
  CargoBanco,
  FinancePage,
} from "./finance.types";

const BASE = "/finance/banks";

export const banksKeys = {
  all: ["finance", "banks"] as const,
  catalogs: ["finance", "banks", "catalogs"] as const,
  deposits: (query: BankMovementsQuery) =>
    ["finance", "banks", "deposits", query] as const,
  charges: (query: BankMovementsQuery) =>
    ["finance", "banks", "charges", query] as const,
};

export function useBankCatalogs() {
  return useQuery({
    queryKey: banksKeys.catalogs,
    queryFn: async () => {
      const response = await apiFetch<{ data: BankCatalogs }>(
        `${BASE}/catalogs`,
      );
      return response.data;
    },
    staleTime: FINANCE_CATALOG_STALE_TIME,
  });
}

export function useBankDeposits(query: BankMovementsQuery, enabled = true) {
  return useQuery({
    queryKey: banksKeys.deposits(query),
    queryFn: () =>
      apiFetch<FinancePage<AbonoBanco>>(`${BASE}/deposits`, {
        query: toQueryParams(query),
      }),
    enabled,
    staleTime: FINANCE_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useBankCharges(query: BankMovementsQuery, enabled = true) {
  return useQuery({
    queryKey: banksKeys.charges(query),
    queryFn: () =>
      apiFetch<FinancePage<CargoBanco>>(`${BASE}/charges`, {
        query: toQueryParams(query),
      }),
    enabled,
    staleTime: FINANCE_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}
