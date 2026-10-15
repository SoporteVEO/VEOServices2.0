import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { crmKeys } from "./crm.get";
import { crmOohKeys } from "./crm-ooh.get";
import type { CrmDealDetail } from "./crm.types";
import type {
  AddDealSitesInput,
  AddDealSitesResult,
  CrmDealSites,
  DealSitesAction,
  UpdateDealSiteInput,
} from "./crm-ooh.types";

type QueryClient = ReturnType<typeof useQueryClient>;

function post<T>(path: string, body: unknown, method = "POST") {
  return apiFetch<{ data: T }>(path, { method, body: JSON.stringify(body) }).then(
    (response) => response.data,
  );
}

function syncSites(queryClient: QueryClient, dealId: string, sites: CrmDealSites) {
  queryClient.setQueryData(crmOohKeys.dealSites(dealId), sites);
  void queryClient.invalidateQueries({ queryKey: crmKeys.all });
}

export function useAddCrmDealSites() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, ...input }: { dealId: string } & AddDealSitesInput) =>
      post<AddDealSitesResult>(`/crm/deals/${dealId}/sites`, input),
    onSuccess: (result, { dealId }) => syncSites(queryClient, dealId, result),
  });
}

export function useUpdateCrmDealSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dealId,
      siteId,
      ...input
    }: { dealId: string; siteId: string } & UpdateDealSiteInput) =>
      post<CrmDealSites>(`/crm/deals/${dealId}/sites/${siteId}`, input, "PATCH"),
    onSuccess: (result, { dealId }) => syncSites(queryClient, dealId, result),
  });
}

export function useCrmDealSitesAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dealId,
      ...input
    }: {
      dealId: string;
      siteIds: string[];
      action: DealSitesAction;
      holdDays?: number;
    }) => post<CrmDealSites>(`/crm/deals/${dealId}/sites/actions`, input),
    onSuccess: (result, { dealId }) => syncSites(queryClient, dealId, result),
  });
}

export function useCreateCrmRenewalDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { key: string; pipelineId?: string }) =>
      post<CrmDealDetail>("/crm/renewals/deals", input),
    onSuccess: (deal) => {
      queryClient.setQueryData(crmKeys.deal(deal.id), deal);
      void queryClient.invalidateQueries({ queryKey: crmKeys.all });
    },
  });
}
