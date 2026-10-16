import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  FINANCE_CATALOG_STALE_TIME,
  FINANCE_STALE_TIME,
  toQueryParams,
} from "./finance-query";
import type {
  AbonoFacturaConsulta,
  ClientCodeQuery,
  FinancePage,
  InvoicePaymentsQuery,
  LimiteCredito,
  ReceivableCatalogs,
  SaldoCxcCliente,
} from "./finance.types";

const BASE = "/finance/receivables";

export const receivablesKeys = {
  all: ["finance", "receivables"] as const,
  catalogs: ["finance", "receivables", "catalogs"] as const,
  balances: (query: ClientCodeQuery) =>
    ["finance", "receivables", "balances", query] as const,
  creditLimits: (query: ClientCodeQuery) =>
    ["finance", "receivables", "credit-limits", query] as const,
  payments: (query: InvoicePaymentsQuery) =>
    ["finance", "receivables", "payments", query] as const,
};

export function useReceivableCatalogs() {
  return useQuery({
    queryKey: receivablesKeys.catalogs,
    queryFn: async () => {
      const response = await apiFetch<{ data: ReceivableCatalogs }>(
        `${BASE}/catalogs`,
      );
      return response.data;
    },
    staleTime: FINANCE_CATALOG_STALE_TIME,
  });
}

export function useReceivableBalances(query: ClientCodeQuery) {
  return useQuery({
    queryKey: receivablesKeys.balances(query),
    queryFn: () =>
      apiFetch<FinancePage<SaldoCxcCliente>>(`${BASE}/balances`, {
        query: toQueryParams(query),
      }),
    staleTime: FINANCE_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useCreditLimits(query: ClientCodeQuery) {
  return useQuery({
    queryKey: receivablesKeys.creditLimits(query),
    queryFn: () =>
      apiFetch<FinancePage<LimiteCredito>>(`${BASE}/credit-limits`, {
        query: toQueryParams(query),
      }),
    staleTime: FINANCE_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useInvoicePayments(query: InvoicePaymentsQuery) {
  return useQuery({
    queryKey: receivablesKeys.payments(query),
    queryFn: () =>
      apiFetch<FinancePage<AbonoFacturaConsulta>>(`${BASE}/payments`, {
        query: toQueryParams(query),
      }),
    staleTime: FINANCE_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}
