import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { crmKeys } from "./crm.get";
import type {
  ConnectWhatsAppInput,
  CreateCrmActivityInput,
  CreateCrmDealInput,
  CreateCrmTaskInput,
  CrmActivity,
  CrmBoard,
  CrmConnections,
  CrmContact,
  CrmContactInput,
  CrmContextQuery,
  CrmDealDetail,
  CrmDealStatus,
  CrmMessage,
  CrmPipeline,
  CrmPipelineInput,
  CrmTask,
  CrmTemplate,
  CrmTemplateInput,
  SendCrmEmailInput,
  SendCrmWhatsAppInput,
  SendCrmWhatsAppResult,
  UpdateCrmDealInput,
  UpdateCrmTaskInput,
} from "./crm.types";

type QueryClient = ReturnType<typeof useQueryClient>;

function invalidateCrm(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: crmKeys.all });
}

function syncDeal(queryClient: QueryClient, deal: CrmDealDetail) {
  queryClient.setQueryData(crmKeys.deal(deal.id), deal);
  invalidateCrm(queryClient);
}

function post<T>(path: string, body?: unknown, method = "POST") {
  return apiFetch<{ data: T }>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((response) => response.data);
}

/* ---------------------------------------------------------------- deals */

export function useCreateCrmDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCrmDealInput) => post<CrmDealDetail>("/crm/deals", input),
    onSuccess: (deal) => syncDeal(queryClient, deal),
  });
}

export function useUpdateCrmDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateCrmDealInput) =>
      post<CrmDealDetail>(`/crm/deals/${id}`, input, "PATCH"),
    onSuccess: (deal) => syncDeal(queryClient, deal),
  });
}

export function useMoveCrmDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      stageId: string;
      beforeDealId?: string | null;
      lostReason?: string;
    }) => post<CrmDealDetail>(`/crm/deals/${id}/move`, input, "PATCH"),
    onMutate: async ({ id, stageId, beforeDealId }) => {
      await queryClient.cancelQueries({ queryKey: ["crm", "board"] });
      const snapshots = queryClient.getQueriesData<CrmBoard>({
        queryKey: ["crm", "board"],
      });
      for (const [key, board] of snapshots) {
        if (!board) continue;
        const stage = board.pipeline.stages.find((s) => s.id === stageId);
        const moving = board.deals.find((d) => d.id === id);
        if (!stage || !moving) continue;
        const rest = board.deals.filter((d) => d.id !== id);
        const before = beforeDealId ? rest.find((d) => d.id === beforeDealId) : null;
        const column = rest
          .filter((d) => d.stage.id === stageId)
          .sort((a, b) => a.position - b.position);
        const beforeIndex = before ? column.findIndex((d) => d.id === before.id) : -1;
        const position =
          beforeIndex === -1
            ? (column.at(-1)?.position ?? 0) + 1
            : beforeIndex === 0
              ? column[0].position - 1
              : (column[beforeIndex - 1].position + column[beforeIndex].position) / 2;
        const status: CrmDealStatus =
          stage.kind === "WON" ? "WON" : stage.kind === "LOST" ? "LOST" : "OPEN";
        queryClient.setQueryData<CrmBoard>(key, {
          ...board,
          deals: [
            ...rest,
            {
              ...moving,
              position,
              status,
              stage: {
                id: stage.id,
                name: stage.name,
                color: stage.color,
                kind: stage.kind,
                probability: stage.probability,
              },
            },
          ],
        });
      }
      return { snapshots };
    },
    onError: (_error, _input, context) => {
      for (const [key, board] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, board);
      }
    },
    onSuccess: (deal) => syncDeal(queryClient, deal),
  });
}

export function useChangeCrmDealStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      status: CrmDealStatus;
      lostReason?: string;
    }) => post<CrmDealDetail>(`/crm/deals/${id}/status`, input, "PATCH"),
    onSuccess: (deal) => syncDeal(queryClient, deal),
  });
}

export function useDeleteCrmDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ deleted: true }>(`/crm/deals/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useLinkCrmOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, offerId }: { dealId: string; offerId: string }) =>
      post<CrmDealDetail>(`/crm/deals/${dealId}/offers`, { offerId }),
    onSuccess: (deal) => syncDeal(queryClient, deal),
  });
}

export function useUnlinkCrmOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, offerId }: { dealId: string; offerId: string }) =>
      post<CrmDealDetail>(`/crm/deals/${dealId}/offers/${offerId}`, undefined, "DELETE"),
    onSuccess: (deal) => syncDeal(queryClient, deal),
  });
}

export function useCreateCrmDealFromOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { offerId: string; pipelineId?: string; stageId?: string }) =>
      post<CrmDealDetail>("/crm/deals/from-offer", input),
    onSuccess: (deal) => syncDeal(queryClient, deal),
  });
}

/* ------------------------------------------------------------ pipelines */

export function useCreateCrmPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrmPipelineInput) => post<CrmPipeline>("/crm/pipelines", input),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useUpdateCrmPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<CrmPipelineInput>) =>
      post<CrmPipeline>(`/crm/pipelines/${id}`, input, "PATCH"),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useDeleteCrmPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ deleted: boolean }>(`/crm/pipelines/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

/* ------------------------------------------------------------- contacts */

export function useCreateCrmContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrmContactInput) => post<CrmContact>("/crm/contacts", input),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useUpdateCrmContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<CrmContactInput>) =>
      post<CrmContact>(`/crm/contacts/${id}`, input, "PATCH"),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useDeleteCrmContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ deleted: true }>(`/crm/contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

/* ----------------------------------------------------------- activities */

export function useCreateCrmActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCrmActivityInput) =>
      post<CrmActivity>("/crm/activities", input),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useDeleteCrmActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ deleted: true }>(`/crm/activities/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

/* ---------------------------------------------------------------- tasks */

export function useCreateCrmTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCrmTaskInput) => post<CrmTask>("/crm/tasks", input),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useUpdateCrmTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateCrmTaskInput) =>
      post<CrmTask>(`/crm/tasks/${id}`, input, "PATCH"),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useDeleteCrmTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ deleted: true }>(`/crm/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

/* ------------------------------------------------------------ templates */

export function useCreateCrmTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrmTemplateInput) => post<CrmTemplate>("/crm/templates", input),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useUpdateCrmTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<CrmTemplateInput>) =>
      post<CrmTemplate>(`/crm/templates/${id}`, input, "PATCH"),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useDuplicateCrmTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      post<CrmTemplate>(`/crm/templates/${id}/duplicate`),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useDeleteCrmTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ deleted: true }>(`/crm/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

/* ------------------------------------------------------------- messages */

export function useSendCrmEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendCrmEmailInput) => post<CrmMessage>("/crm/messages/email", input),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useSyncCrmEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrmContextQuery) =>
      post<{ imported: number }>("/crm/messages/email/sync", input),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

export function useSendCrmWhatsApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendCrmWhatsAppInput) =>
      post<SendCrmWhatsAppResult>("/crm/messages/whatsapp", input),
    onSuccess: () => invalidateCrm(queryClient),
  });
}

/* ---------------------------------------------------------- connections */

function syncConnections(queryClient: QueryClient, data?: CrmConnections) {
  if (data) queryClient.setQueryData(crmKeys.connections, data);
  void queryClient.invalidateQueries({ queryKey: crmKeys.connections });
}

export function useGmailAuthUrl() {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ data: { url: string } }>("/crm/connections/gmail/auth-url").then(
        (response) => response.data.url,
      ),
  });
}

export function useUpdateEmailSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { signature: string }) =>
      post<CrmConnections>("/crm/connections/gmail/signature", input, "PUT"),
    onSuccess: (data) => syncConnections(queryClient, data),
  });
}

export function useDisconnectGmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ disconnected: true }>("/crm/connections/gmail", { method: "DELETE" }),
    onSuccess: () => syncConnections(queryClient),
  });
}

export function useConnectWhatsApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConnectWhatsAppInput) =>
      post<CrmConnections>("/crm/connections/whatsapp", input),
    onSuccess: (data) => {
      syncConnections(queryClient, data);
      void queryClient.invalidateQueries({ queryKey: crmKeys.whatsappTemplates });
    },
  });
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ disconnected: true }>("/crm/connections/whatsapp", { method: "DELETE" }),
    onSuccess: () => syncConnections(queryClient),
  });
}
