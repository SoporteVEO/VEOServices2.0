import type { ClientType } from "@/api/clients/clients.types";
import type { CrmSiteKind } from "./crm-ooh.types";

export type CrmStageKind = "OPEN" | "WON" | "LOST";
export type CrmDealStatus = "OPEN" | "WON" | "LOST";
export type CrmPriority = "LOW" | "MEDIUM" | "HIGH";
export type CrmDealSource =
  | "REFERRAL"
  | "WEBSITE"
  | "COLD_CALL"
  | "EVENT"
  | "SOCIAL_MEDIA"
  | "EXISTING_CLIENT"
  | "AGENCY"
  | "OFFER"
  | "RENEWAL"
  | "WEB_SHOP"
  | "OTHER";
export type CrmMediaType = "STATIC" | "DIGITAL" | "MIXED";
export type CrmActivityType =
  | "NOTE"
  | "CALL"
  | "MEETING"
  | "EMAIL"
  | "WHATSAPP"
  | "TASK_COMPLETED"
  | "STAGE_CHANGED"
  | "DEAL_CREATED"
  | "DEAL_WON"
  | "DEAL_LOST"
  | "DEAL_REOPENED"
  | "OFFER_LINKED"
  | "INVENTORY_CHANGED";
export type CrmLoggableActivityType = "NOTE" | "CALL" | "MEETING";
export type CrmTaskType =
  | "CALL"
  | "EMAIL"
  | "WHATSAPP"
  | "MEETING"
  | "FOLLOW_UP"
  | "OTHER";
export type CrmTaskBucket = "overdue" | "today" | "upcoming" | "completed" | "open";
export type CrmChannel = "EMAIL" | "WHATSAPP";
export type CrmMessageDirection = "OUTBOUND" | "INBOUND";
export type CrmMessageStatus = "SENT" | "DELIVERED" | "READ" | "FAILED" | "RECEIVED";
export type CrmConnectionStatus = "ACTIVE" | "ERROR";
export type OfferStatus = "PENDING" | "DECLINED" | "ACCEPTED";
export type CrmDashboardScope = "mine" | "team";

export interface CrmUserSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export interface CrmStage {
  id: string;
  name: string;
  color: string | null;
  position: number;
  probability: number;
  kind: CrmStageKind;
  rottingDays: number | null;
  openDeals: number;
  openValue: number;
}

export interface CrmPipeline {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  archived: boolean;
  position: number;
  stages: CrmStage[];
  createdAt: string;
}

export interface CrmStageInput {
  id?: string;
  name: string;
  color?: string;
  probability: number;
  kind: CrmStageKind;
  rottingDays?: number | null;
}

export interface CrmPipelineInput {
  name: string;
  description?: string | null;
  isDefault?: boolean;
  archived?: boolean;
  stages: CrmStageInput[];
}

export interface CrmOfferSummary {
  id: string;
  offerNumber: string;
  status: OfferStatus;
  total: number;
  customerName: string;
  customerCompany: string | null;
  validUntil: string;
  createdAt: string;
  createdByName: string;
  dealId: string | null;
}

export interface CrmDealContact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
}

export interface CrmDeal {
  id: string;
  title: string;
  value: number;
  status: CrmDealStatus;
  priority: CrmPriority;
  source: CrmDealSource | null;
  tags: string[];
  expectedCloseDate: string | null;
  mediaType: CrmMediaType | null;
  brand: string | null;
  industry: string | null;
  campaignStart: string | null;
  campaignEnd: string | null;
  targetZones: string[];
  agencyCommissionPct: number | null;
  renewalOf: string | null;
  siteCount: number;
  heldSiteCount: number;
  nextHoldExpiry: string | null;
  holdExpiringSoon: boolean;
  pipelineId: string;
  stage: {
    id: string;
    name: string;
    color: string | null;
    kind: CrmStageKind;
    probability: number;
  };
  position: number;
  client: { id: string; name: string; company: string | null } | null;
  contact: CrmDealContact | null;
  owner: CrmUserSummary;
  offerCount: number;
  openTaskCount: number;
  nextTask: { id: string; title: string; dueAt: string; isOverdue: boolean } | null;
  isStale: boolean;
  lastActivityAt: string;
  stageChangedAt: string;
  wonAt: string | null;
  lostAt: string | null;
  createdAt: string;
}

export interface CrmDealDetail extends CrmDeal {
  description: string | null;
  lostReason: string | null;
  createdBy: CrmUserSummary | null;
  offers: CrmOfferSummary[];
  updatedAt: string;
}

export interface CrmBoard {
  pipeline: CrmPipeline;
  deals: CrmDeal[];
}

export interface CrmDealsQuery {
  pipelineId?: string;
  ownerId?: string;
  search?: string;
  status?: CrmDealStatus;
  mediaType?: CrmMediaType;
  clientId?: string;
  contactId?: string;
}

export interface CrmDealBriefInput {
  mediaType?: CrmMediaType | null;
  brand?: string | null;
  industry?: string | null;
  campaignStart?: string | null;
  campaignEnd?: string | null;
  targetZones?: string[];
  agencyCommissionPct?: number | null;
}

export interface CreateCrmDealInput extends CrmDealBriefInput {
  title: string;
  pipelineId: string;
  stageId?: string;
  clientId?: string | null;
  contactId?: string | null;
  ownerId?: string;
  value?: number;
  expectedCloseDate?: string | null;
  priority?: CrmPriority;
  source?: CrmDealSource | null;
  tags?: string[];
  description?: string | null;
}

export type UpdateCrmDealInput = Partial<
  Omit<CreateCrmDealInput, "pipelineId" | "stageId">
>;

export interface CrmContact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  jobTitle: string | null;
  notes: string | null;
  isPrimary: boolean;
  client: { id: string; name: string; company: string | null } | null;
  openDeals: number;
  createdAt: string;
  updatedAt: string;
}

export interface CrmContactInput {
  clientId?: string | null;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
  isPrimary?: boolean;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CrmContactsQuery {
  search?: string;
  clientId?: string;
  page?: number;
  pageSize?: number;
}

export interface CrmActivity {
  id: string;
  type: CrmActivityType;
  subject: string | null;
  body: string | null;
  occurredAt: string;
  durationMinutes: number | null;
  deal: { id: string; title: string } | null;
  clientId: string | null;
  contact: { id: string; firstName: string; lastName: string | null } | null;
  actor: CrmUserSummary | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CrmContextQuery {
  dealId?: string;
  clientId?: string;
  contactId?: string;
}

export interface CreateCrmActivityInput extends CrmContextQuery {
  type: CrmLoggableActivityType;
  subject?: string;
  body?: string;
  occurredAt?: string;
  durationMinutes?: number;
}

export interface CrmTask {
  id: string;
  title: string;
  description: string | null;
  type: CrmTaskType;
  priority: CrmPriority;
  dueAt: string;
  completedAt: string | null;
  isOverdue: boolean;
  assignee: CrmUserSummary;
  deal: { id: string; title: string } | null;
  client: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string | null } | null;
  createdAt: string;
}

export interface CrmTasksQuery extends CrmContextQuery {
  assigneeId?: string;
  bucket?: CrmTaskBucket;
}

export interface CrmTaskCounts {
  overdue: number;
  today: number;
  upcoming: number;
}

export interface CreateCrmTaskInput {
  title: string;
  description?: string | null;
  type?: CrmTaskType;
  priority?: CrmPriority;
  dueAt: string;
  assigneeId?: string;
  dealId?: string | null;
  clientId?: string | null;
  contactId?: string | null;
}

export interface UpdateCrmTaskInput {
  title?: string;
  description?: string | null;
  type?: CrmTaskType;
  priority?: CrmPriority;
  dueAt?: string;
  assigneeId?: string;
  completed?: boolean;
}

export interface CrmTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string | null;
  isShared: boolean;
  isOwner: boolean;
  usageCount: number;
  owner: CrmUserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTemplateInput {
  name: string;
  subject: string;
  body: string;
  category?: string | null;
  isShared?: boolean;
}

export type CrmTemplateVariables = Record<string, string>;

export interface CrmMessage {
  id: string;
  channel: CrmChannel;
  direction: CrmMessageDirection;
  status: CrmMessageStatus;
  toAddress: string;
  fromAddress: string | null;
  cc: string | null;
  subject: string | null;
  body: string;
  threadId: string | null;
  error: string | null;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  user: CrmUserSummary | null;
  deal: { id: string; title: string } | null;
  contact: { id: string; firstName: string; lastName: string | null } | null;
  template: { id: string; name: string } | null;
}

export interface SendCrmEmailInput extends CrmContextQuery {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  templateId?: string;
  threadId?: string;
}

export interface SendCrmWhatsAppInput extends CrmContextQuery {
  to: string;
  mode: "API" | "MANUAL";
  body?: string;
  template?: { name: string; language: string; parameters: string[] };
}

export interface SendCrmWhatsAppResult {
  message: CrmMessage;
  waLink: string | null;
}

export interface CrmWhatsAppTemplate {
  name: string;
  language: string;
  category: string | null;
  bodyText: string | null;
  parameterCount: number;
}

export interface CrmConnections {
  gmail: {
    configured: boolean;
    allowedDomain: string;
    connected: boolean;
    status: CrmConnectionStatus | null;
    email: string | null;
    signature: string | null;
    lastError: string | null;
    connectedAt: string | null;
  };
  whatsapp: {
    connected: boolean;
    status: CrmConnectionStatus | null;
    displayPhoneNumber: string | null;
    verifiedName: string | null;
    phoneNumberId: string | null;
    businessAccountId: string | null;
    webhookConfigured: boolean;
    lastError: string | null;
    connectedAt: string | null;
  };
}

export interface ConnectWhatsAppInput {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
}

export interface CrmDashboardDeal {
  id: string;
  title: string;
  value: number;
  stageName: string;
  stageColor: string | null;
  clientName: string | null;
  ownerName: string;
  expectedCloseDate: string | null;
  lastActivityAt: string;
}

export interface CrmDashboard {
  scope: CrmDashboardScope;
  period: { from: string; to: string };
  totals: {
    openDeals: number;
    openValue: number;
    weightedValue: number;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    winRate: number;
    avgDealSize: number;
    avgCycleDays: number;
    newDeals: number;
    emailsSent: number;
    whatsappSent: number;
    activities: number;
    overdueTasks: number;
    todayTasks: number;
  };
  pipeline: {
    id: string;
    name: string;
    stages: {
      id: string;
      name: string;
      color: string | null;
      kind: CrmStageKind;
      count: number;
      value: number;
    }[];
  };
  trend: {
    month: string;
    wonValue: number;
    wonCount: number;
    lostCount: number;
    newDeals: number;
  }[];
  bySource: { source: CrmDealSource | null; count: number; value: number }[];
  activityByType: { type: CrmActivityType; count: number }[];
  offers: {
    byStatus: { status: OfferStatus; count: number; total: number }[];
    unlinked: CrmOfferSummary[];
    unlinkedCount: number;
  };
  upcomingTasks: {
    id: string;
    title: string;
    dueAt: string;
    dealTitle: string | null;
    isOverdue: boolean;
  }[];
  topDeals: CrmDashboardDeal[];
  staleDeals: CrmDashboardDeal[];
  leaderboard: {
    user: CrmUserSummary;
    wonValue: number;
    wonCount: number;
    openValue: number;
    openCount: number;
  }[];
  ooh: CrmOohDashboard;
}

export interface CrmOohDashboard {
  byMediaType: { mediaType: CrmMediaType | null; openCount: number; openValue: number }[];
  holds: {
    active: number;
    expiringSoon: number;
    expired: number;
    items: {
      siteId: string;
      code: string;
      label: string;
      kind: CrmSiteKind;
      holdUntil: string;
      isExpired: boolean;
      dealId: string;
      dealTitle: string;
    }[];
  };
  flightForecast: { month: string; booked: number; held: number }[];
  renewals: { available: boolean; due: number; unmanaged: number; endingIn30: number };
}

export interface CrmDashboardQuery {
  scope: CrmDashboardScope;
  pipelineId?: string;
  from?: string;
  to?: string;
}

export interface CrmClientRow {
  id: string;
  type: ClientType;
  name: string;
  company: string | null;
  email: string | null;
  contact: string | null;
  contactsCount: number;
  openDeals: number;
  openValue: number;
  wonValue: number;
  offersCount: number;
  lastActivityAt: string | null;
}

export interface CrmClientsQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  withOpenDeals?: boolean;
  type?: ClientType;
}

export interface CrmClientSummary {
  client: {
    id: string;
    type: ClientType;
    name: string;
    company: string | null;
    email: string | null;
    billingEmail: string | null;
    contact: string | null;
    createdAt: string;
  };
  stats: {
    openDeals: number;
    openValue: number;
    wonDeals: number;
    wonValue: number;
    lostDeals: number;
    offersCount: number;
    offersAccepted: number;
    offersTotal: number;
    lastActivityAt: string | null;
  };
  offers: CrmOfferSummary[];
}
