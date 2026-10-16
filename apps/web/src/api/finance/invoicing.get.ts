import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, apiFetch } from "@/lib/api";
import { FINANCE_STALE_TIME, toQueryParams } from "./finance-query";
import type {
  Factura,
  FacturaDetail,
  FinancePage,
  InvoicesQuery,
  OdfDetail,
  OrderEmails,
  OrdersPage,
  OrdersQuery,
} from "./finance.types";

const BASE = "/finance/invoicing";

export const invoicingKeys = {
  all: ["finance", "invoicing"] as const,
  invoices: (query: InvoicesQuery) =>
    ["finance", "invoicing", "invoices", query] as const,
  invoice: (mfaId: number | null) =>
    ["finance", "invoicing", "invoice", mfaId] as const,
  orders: (query: OrdersQuery) =>
    ["finance", "invoicing", "orders", query] as const,
  order: (mfaId: number | null) =>
    ["finance", "invoicing", "order", mfaId] as const,
  orderEmails: (mfaId: number | null) =>
    ["finance", "invoicing", "order-emails", mfaId] as const,
};

export function useInvoices(query: InvoicesQuery) {
  return useQuery({
    queryKey: invoicingKeys.invoices(query),
    queryFn: () =>
      apiFetch<FinancePage<Factura>>(`${BASE}/invoices`, {
        query: toQueryParams(query),
      }),
    staleTime: FINANCE_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(mfaId: number | null) {
  return useQuery({
    queryKey: invoicingKeys.invoice(mfaId),
    queryFn: async () => {
      const response = await apiFetch<{ data: FacturaDetail }>(
        `${BASE}/invoices/${mfaId}`,
      );
      return response.data;
    },
    enabled: mfaId != null,
    staleTime: FINANCE_STALE_TIME,
  });
}

export function useOrders(query: OrdersQuery) {
  return useQuery({
    queryKey: invoicingKeys.orders(query),
    queryFn: () =>
      apiFetch<OrdersPage>(`${BASE}/orders`, { query: toQueryParams(query) }),
    staleTime: FINANCE_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useOrder(mfaId: number | null) {
  return useQuery({
    queryKey: invoicingKeys.order(mfaId),
    queryFn: async () => {
      const response = await apiFetch<{ data: OdfDetail }>(
        `${BASE}/orders/${mfaId}`,
      );
      return response.data;
    },
    enabled: mfaId != null,
    staleTime: FINANCE_STALE_TIME,
  });
}

export function useOrderEmails(mfaId: number | null, enabled = true) {
  return useQuery({
    queryKey: invoicingKeys.orderEmails(mfaId),
    queryFn: async () => {
      const response = await apiFetch<{ data: OrderEmails }>(
        `${BASE}/orders/${mfaId}/emails`,
      );
      return response.data;
    },
    enabled: enabled && mfaId != null,
    staleTime: FINANCE_STALE_TIME,
  });
}

export async function getOrderPdf(mfaId: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`${BASE}/orders/${mfaId}/pdf`, {
    responseType: "blob",
  });
  return data;
}
