import type { CrmDealStatus } from "./crm.types";

export type CrmSiteKind = "STATIC" | "DIGITAL";
export type CrmSiteStatus = "PROPOSED" | "HELD" | "BOOKED" | "RELEASED";
export type InventoryState = "AVAILABLE" | "HELD" | "BOOKED" | "CONTRACTED" | "FULL";

export interface InventoryHold {
  siteId: string;
  dealId: string;
  dealTitle: string;
  ownerName: string;
  status: "HELD" | "BOOKED";
  holdUntil: string | null;
  rank: number;
  brand: string | null;
  industry: string | null;
  spotsPerDay: number | null;
  startDate: string;
  endDate: string;
}

export interface InventoryItem {
  key: string;
  kind: CrmSiteKind;
  billboardId: number | null;
  digitalBillboardId: string | null;
  code: string;
  label: string;
  cityName: string | null;
  departmentName: string | null;
  latitude: number | null;
  longitude: number | null;
  width: number | null;
  height: number | null;
  rate: number;
  state: InventoryState;
  capacity: number | null;
  usedSpots: number | null;
  heldSpots: number | null;
  freeSpots: number | null;
  holds: InventoryHold[];
  competitorConflict: boolean;
  inDeal: boolean;
}

export interface InventoryResult {
  from: string;
  to: string;
  items: InventoryItem[];
  departments: string[];
  totals: Record<InventoryState, number>;
  truncated: boolean;
}

export interface InventoryQuery {
  from: string;
  to: string;
  kind?: CrmSiteKind;
  department?: string;
  search?: string;
  dealId?: string;
  industry?: string;
  onlyAvailable?: boolean;
}

export interface CrmDealSite {
  id: string;
  kind: CrmSiteKind;
  billboardId: number | null;
  digitalBillboardId: string | null;
  code: string;
  label: string;
  cityName: string | null;
  departmentName: string | null;
  latitude: number | null;
  longitude: number | null;
  width: number | null;
  height: number | null;
  startDate: string;
  endDate: string;
  spotsPerDay: number | null;
  rate: number;
  total: number;
  status: CrmSiteStatus;
  heldAt: string | null;
  holdUntil: string | null;
  holdExpired: boolean;
  holdExpiringSoon: boolean;
  rank: number | null;
  contracted: boolean;
  conflicts: InventoryHold[];
  createdByName: string | null;
}

export interface CrmDealSites {
  sites: CrmDealSite[];
  summary: {
    activeCount: number;
    staticCount: number;
    digitalCount: number;
    heldCount: number;
    bookedCount: number;
    expiringCount: number;
    conflictCount: number;
    totalValue: number;
    spotsPerDay: number;
  };
}

export interface AddDealSitesResult extends CrmDealSites {
  added: number;
  warnings: string[];
}

export interface AddDealSitesInput {
  sites: {
    kind: CrmSiteKind;
    billboardId?: number;
    digitalBillboardId?: string;
    spotsPerDay?: number;
    rate?: number;
  }[];
  startDate: string;
  endDate: string;
  hold?: boolean;
  holdDays?: number;
}

export interface UpdateDealSiteInput {
  startDate?: string;
  endDate?: string;
  spotsPerDay?: number | null;
  rate?: number;
}

export type DealSitesAction = "hold" | "release" | "remove" | "propose";

export interface CrmExecutionStaticItem {
  id: string;
  offerNumber: string;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  status: "RECEIVED" | "IN_PRODUCTION" | "COMPLETED" | "CANCELLED";
  hasDesign: boolean;
  scheduledInstallationAt: string | null;
  installedAt: string | null;
  installerName: string | null;
  proofCount: number;
}

export interface CrmExecutionDigitalItem {
  id: string;
  offerNumber: string;
  screenName: string;
  startDate: string | null;
  endDate: string | null;
  spotsPerDay: number;
  art: "RECEIVED" | "MISSING" | "PENDING_APPROVAL";
  paused: boolean;
  pauseReason: string | null;
  isLive: boolean;
}

export interface CrmDealExecution {
  offers: {
    id: string;
    offerNumber: string;
    status: "PENDING" | "DECLINED" | "ACCEPTED";
    productionOrderNumber: string | null;
  }[];
  staticItems: CrmExecutionStaticItem[];
  digitalItems: CrmExecutionDigitalItem[];
  summary: {
    staticTotal: number;
    installed: number;
    pendingInstall: number;
    missingProof: number;
    digitalTotal: number;
    live: number;
    artPending: number;
  };
}

export interface CrmRenewalItem {
  key: string;
  kind: CrmSiteKind;
  reference: string;
  description: string | null;
  brand: string | null;
  customerName: string;
  agencyName: string | null;
  executiveName: string | null;
  startDate: string;
  endDate: string;
  daysLeft: number;
  siteCount: number;
  spotsPerDay: number | null;
  value: number | null;
  client: { id: string; name: string; company: string | null } | null;
  deal: {
    id: string;
    title: string;
    status: CrmDealStatus;
    stageName: string;
    ownerName: string;
  } | null;
  isMine: boolean;
}

export interface CrmRenewals {
  from: string;
  to: string;
  items: CrmRenewalItem[];
  summary: {
    total: number;
    unmanaged: number;
    inProgress: number;
    won: number;
    lost: number;
    endingIn30: number;
  };
}

export interface CrmRenewalsQuery {
  days: number;
  pastDays?: number;
  scope: "mine" | "team";
  kind?: CrmSiteKind;
  search?: string;
}
