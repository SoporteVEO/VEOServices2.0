export type ProfitabilityTier = "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
export type ProfitabilityBasis = "COST" | "OCCUPANCY";
export type ExpansionSiteStatus = "PROPOSED" | "EVALUATING" | "APPROVED" | "DISCARDED";
export type ExpansionSitePriority = "LOW" | "MEDIUM" | "HIGH";

export interface ExpansionPeriod {
  from: string;
  to: string;
  days: number;
  months: number;
  year: number | null;
  label: string;
}

export interface ExpansionBillboard {
  billboardId: number;
  code: string;
  address: string | null;
  reference: string | null;
  cityName: string | null;
  departmentName: string | null;
  latitude: number | null;
  longitude: number | null;
  width: number | null;
  height: number | null;
  formatCode: string | null;
  structureName: string | null;
  listPrice: number | null;
  occupiedNow: boolean;
  currentCustomer: string | null;
  contractsCount: number;
  customersCount: number;
  occupiedDays: number;
  occupiedMonths: number;
  occupancyRate: number;
  revenue: number;
  monthlyCost: number | null;
  costNotes: string | null;
  cost: number | null;
  profit: number | null;
  margin: number | null;
  roi: number | null;
  score: number;
  tier: ProfitabilityTier;
  basis: ProfitabilityBasis;
}

export interface ExpansionScreen {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  departmentName: string | null;
}

export interface ExpansionBillboardsResult {
  period: ExpansionPeriod;
  billboards: ExpansionBillboard[];
  screens: ExpansionScreen[];
}

export interface ExpansionBillboardDetail {
  period: ExpansionPeriod;
  billboard: ExpansionBillboard;
  months: { month: string; occupancy: number; revenue: number }[];
  contracts: {
    contractCode: string | null;
    customerName: string | null;
    startDate: string;
    endDate: string;
    monthlyAmount: number;
    revenueInPeriod: number;
  }[];
  photoImageId: number | null;
}

export type RoadClass =
  | "HIGHWAY"
  | "PRIMARY"
  | "SECONDARY"
  | "TERTIARY"
  | "LOCAL"
  | "PATH"
  | "UNKNOWN";

export type ContextLevel = "HIGH" | "MEDIUM" | "LOW";

export interface LocationContext {
  version: 1;
  fetchedAt: string;
  sources: { nominatim: boolean; overpass: boolean };
  road: { name: string | null; roadClass: RoadClass } | null;
  majorRoads: { name: string | null; roadClass: RoadClass; distanceM: number }[];
  locality: {
    neighbourhood: string | null;
    suburb: string | null;
    city: string | null;
    municipality: string | null;
    department: string | null;
  };
  settlement: "CITY" | "TOWN" | "VILLAGE" | "RURAL" | "UNKNOWN";
  poiCount500m: number | null;
  buildingCount300m: number | null;
  landuse: string[];
  exposureScore: number;
  densityScore: number;
  trafficLevel: ContextLevel;
  densityLevel: ContextLevel;
}

export type NexoVerdict = "RECOMMENDED" | "CAUTION" | "NOT_RECOMMENDED";

export interface ExpansionNexoInsight {
  verdict: NexoVerdict;
  headline: string;
  summary: string;
  strengths: string[];
  risks: string[];
  suggestions: string[];
  generatedAt: string;
  usedSurroundings: boolean;
}

export interface ExpansionNexoInsightInput {
  latitude: number;
  longitude: number;
  siteId?: string;
  name?: string | null;
  formatCode?: string | null;
  width?: number | null;
  height?: number | null;
  estimatedMonthlyPrice?: number | null;
  estimatedMonthlyCost?: number | null;
  analysis: {
    score: number;
    verdict: NexoVerdict | "INSUFFICIENT_DATA";
    confidence: ContextLevel;
    factors: { key: string; value: number; weight: number }[];
    caps: string[];
    within500m: number;
    within1Km: number;
    saturation: "UNDERSERVED" | "BALANCED" | "SATURATED";
    nearestDistanceM: number | null;
    nearestCode: string | null;
    avgOccupancy: number | null;
    avgScore: number | null;
    medianPrice: number | null;
    estimatedMonthlyRevenue: number | null;
    estimatedRoi: number | null;
    breakEvenOccupancy: number | null;
  };
}

export interface ExpansionPerson {
  id: string;
  firstName: string;
  lastName: string | null;
}

export interface ExpansionSite {
  id: string;
  number: number;
  code: string;
  name: string;
  status: ExpansionSiteStatus;
  priority: ExpansionSitePriority;
  latitude: number;
  longitude: number;
  address: string | null;
  departmentName: string | null;
  description: string | null;
  formatCode: string | null;
  width: number | null;
  height: number | null;
  estimatedMonthlyCost: number | null;
  estimatedMonthlyPrice: number | null;
  locationContext: LocationContext | null;
  createdAt: string;
  updatedAt: string;
  createdBy: ExpansionPerson | null;
  commentsCount: number;
  documentsCount: number;
}

export interface ExpansionSiteComment {
  id: string;
  body: string;
  createdAt: string;
  author: ExpansionPerson | null;
}

export interface ExpansionSiteDocument {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: ExpansionPerson | null;
}

export interface ExpansionSiteDetail extends ExpansionSite {
  comments: ExpansionSiteComment[];
  documents: ExpansionSiteDocument[];
}

export interface ExpansionSiteInput {
  name: string;
  latitude: number;
  longitude: number;
  status?: ExpansionSiteStatus;
  priority?: ExpansionSitePriority;
  address?: string | null;
  departmentName?: string | null;
  description?: string | null;
  formatCode?: string | null;
  width?: number | null;
  height?: number | null;
  estimatedMonthlyCost?: number | null;
  estimatedMonthlyPrice?: number | null;
}
