import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  CrmActivity,
  CrmBoard,
  CrmClientRow,
  CrmClientsQuery,
  CrmClientSummary,
  CrmConnections,
  CrmContact,
  CrmContactsQuery,
  CrmContextQuery,
  CrmDashboard,
  CrmDashboardQuery,
  CrmDeal,
  CrmDealDetail,
  CrmDealsQuery,
  CrmMessage,
  CrmOfferSummary,
  CrmPipeline,
  CrmTask,
  CrmTaskCounts,
  CrmTasksQuery,
  CrmTemplate,
  CrmTemplateVariables,
  CrmUserSummary,
  CrmWhatsAppTemplate,
  Paginated,
} from "./crm.types";

const STALE_TIME = 30 * 1000;

export const crmKeys = {
  all: ["crm"] as const,
  pipelines: (includeArchived: boolean) =>
    ["crm", "pipelines", includeArchived] as const,
  board: (query: CrmDealsQuery) => ["crm", "board", query] as const,
  deals: (query: CrmDealsQuery) => ["crm", "deals", query] as const,
  deal: (id: string | null) => ["crm", "deal", id] as const,
  availableOffers: (dealId: string, search: string) =>
    ["crm", "deal", dealId, "available-offers", search] as const,
  contacts: (query: CrmContactsQuery) => ["crm", "contacts", query] as const,
  contact: (id: string | null) => ["crm", "contact", id] as const,
  activities: (query: CrmContextQuery) => ["crm", "activities", query] as const,
  tasks: (query: CrmTasksQuery) => ["crm", "tasks", query] as const,
  taskCounts: ["crm", "tasks", "counts"] as const,
  templates: ["crm", "templates"] as const,
  templateContext: (query: CrmContextQuery) =>
    ["crm", "templates", "context", query] as const,
  emailRender: (body: string) => ["crm", "email-render", body] as const,
  messages: (query: CrmContextQuery) => ["crm", "messages", query] as const,
  whatsappTemplates: ["crm", "whatsapp-templates"] as const,
  connections: ["crm", "connections"] as const,
  dashboard: (query: CrmDashboardQuery) => ["crm", "dashboard", query] as const,
  team: ["crm", "team"] as const,
  clients: (query: CrmClientsQuery) => ["crm", "clients", query] as const,
  clientSummary: (id: string | null) => ["crm", "client-summary", id] as const,
};

export function compact(query: object): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params[key] = String(value);
  }
  return params;
}

export function useCrmPipelines(includeArchived = false) {
  return useQuery({
    queryKey: crmKeys.pipelines(includeArchived),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmPipeline[] }>("/crm/pipelines", {
        query: includeArchived ? { includeArchived: "true" } : undefined,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCrmBoard(query: CrmDealsQuery) {
  return useQuery({
    queryKey: crmKeys.board(query),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmBoard }>("/crm/deals/board", {
        query: compact(query),
      });
      return response.data;
    },
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useCrmDeals(query: CrmDealsQuery, enabled = true) {
  return useQuery({
    queryKey: crmKeys.deals(query),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmDeal[] }>("/crm/deals", {
        query: compact(query),
      });
      return response.data;
    },
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useCrmDeal(id: string | null) {
  return useQuery({
    queryKey: crmKeys.deal(id),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmDealDetail }>(`/crm/deals/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}

export function useCrmAvailableOffers(dealId: string, search: string, enabled: boolean) {
  return useQuery({
    queryKey: crmKeys.availableOffers(dealId, search),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmOfferSummary[] }>(
        `/crm/deals/${dealId}/available-offers`,
        { query: compact({ search }) },
      );
      return response.data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCrmContacts(query: CrmContactsQuery, enabled = true) {
  return useQuery({
    queryKey: crmKeys.contacts(query),
    queryFn: () =>
      apiFetch<Paginated<CrmContact>>("/crm/contacts", { query: compact(query) }),
    enabled,
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useCrmContact(id: string | null) {
  return useQuery({
    queryKey: crmKeys.contact(id),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmContact }>(`/crm/contacts/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}

export function useCrmActivities(query: CrmContextQuery, enabled = true) {
  return useQuery({
    queryKey: crmKeys.activities(query),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmActivity[] }>("/crm/activities", {
        query: compact(query),
      });
      return response.data;
    },
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useCrmTasks(query: CrmTasksQuery, enabled = true) {
  return useQuery({
    queryKey: crmKeys.tasks(query),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmTask[] }>("/crm/tasks", {
        query: compact(query),
      });
      return response.data;
    },
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useCrmTaskCounts() {
  return useQuery({
    queryKey: crmKeys.taskCounts,
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmTaskCounts }>("/crm/tasks/counts");
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

export function useCrmTemplates() {
  return useQuery({
    queryKey: crmKeys.templates,
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmTemplate[] }>("/crm/templates");
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

export function useCrmTemplateContext(query: CrmContextQuery, enabled = true) {
  return useQuery({
    queryKey: crmKeys.templateContext(query),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmTemplateVariables }>(
        "/crm/templates/context",
        { query: compact(query) },
      );
      return response.data;
    },
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useCrmEmailRender(body: string, enabled = true) {
  return useQuery({
    queryKey: crmKeys.emailRender(body),
    queryFn: async () => {
      const response = await apiFetch<{ data: { html: string } }>(
        "/crm/templates/render",
        { method: "POST", body: JSON.stringify({ body }) },
      );
      return response.data.html;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useCrmMessages(query: CrmContextQuery, enabled = true) {
  return useQuery({
    queryKey: crmKeys.messages(query),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmMessage[] }>("/crm/messages", {
        query: compact(query),
      });
      return response.data;
    },
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useCrmWhatsAppTemplates(enabled: boolean) {
  return useQuery({
    queryKey: crmKeys.whatsappTemplates,
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmWhatsAppTemplate[] }>(
        "/crm/messages/whatsapp/templates",
      );
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCrmConnections() {
  return useQuery({
    queryKey: crmKeys.connections,
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmConnections }>("/crm/connections");
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

export function useCrmDashboard(query: CrmDashboardQuery) {
  return useQuery({
    queryKey: crmKeys.dashboard(query),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmDashboard }>("/crm/dashboard", {
        query: compact(query),
      });
      return response.data;
    },
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useCrmTeam() {
  return useQuery({
    queryKey: crmKeys.team,
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmUserSummary[] }>("/crm/team");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCrmClients(query: CrmClientsQuery) {
  return useQuery({
    queryKey: crmKeys.clients(query),
    queryFn: () =>
      apiFetch<Paginated<CrmClientRow>>("/crm/clients", { query: compact(query) }),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useCrmClientSummary(id: string | null) {
  return useQuery({
    queryKey: crmKeys.clientSummary(id),
    queryFn: async () => {
      const response = await apiFetch<{ data: CrmClientSummary }>(
        `/crm/clients/${id}/summary`,
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}
