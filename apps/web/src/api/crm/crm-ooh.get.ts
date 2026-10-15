import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { compact } from "./crm.get";
import type {
  CrmDealExecution,
  CrmDealSites,
  CrmRenewals,
  CrmRenewalsQuery,
  InventoryQuery,
  InventoryResult,
} from "./crm-ooh.types";

export const crmOohKeys = {
  inventory: (query: InventoryQuery) => ["crm", "inventory", query] as const,
  dealSites: (dealId: string) => ["crm", "deal", dealId, "sites"] as const,
  execution: (dealId: string) => ["crm", "deal", dealId, "execution"] as const,
  renewals: (query: CrmRenewalsQuery) => ["crm", "renewals", query] as const,
};

export function useCrmInventory(query: InventoryQuery, enabled = true) {
  return useQuery({
    queryKey: crmOohKeys.inventory(query),
    queryFn: async () => {
      const response = await apiFetch<{ data: InventoryResult }>("/crm/inventory", {
        query: compact(query),
      });
      return response.data;
    },
    enabled: enabled && !!query.from && !!query.to,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useCrmDealSites(dealId: string) {
  return useQuery({
    queryKey: crmOohKeys.dealSites(dealId),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmDealSites }>(`/crm/deals/${dealId}/sites`);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useCrmDealExecution(dealId: string, enabled = true) {
  return useQuery({
    queryKey: crmOohKeys.execution(dealId),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmDealExecution }>(
        `/crm/deals/${dealId}/execution`,
      );
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useCrmRenewals(query: CrmRenewalsQuery) {
  return useQuery({
    queryKey: crmOohKeys.renewals(query),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmRenewals }>("/crm/renewals", {
        query: compact(query),
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
