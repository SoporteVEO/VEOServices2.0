export type CampaignArt = "RECEIVED" | "MISSING" | "PENDING_APPROVAL";

export type CampaignDeal =
  | "COMMERCIAL"
  | "DONATION"
  | "EXCHANGE"
  | "DATION"
  | "BONUS";

export type PantallasLogType =
  | "NEW"
  | "RENEWED"
  | "EXTENDED"
  | "SHORTENED"
  | "EDITED"
  | "PAUSED"
  | "RESUMED"
  | "MOVED"
  | "REMOVED";

export interface CampaignVersion {
  id?: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
}

export interface Campaign {
  id: string;
  sublistId: string;
  client: string;
  campaign: string;
  startDate: string | null;
  endDate: string | null;
  spotsPerDay: number;
  notes: string | null;
  paused: boolean;
  pauseReason: string | null;
  art: CampaignArt;
  deal: CampaignDeal;
  monthlyValue: number | null;
  spotValue: number | null;
  totalValue: number | null;
  orderGroupId: string | null;
  offerItemId: string | null;
  versions: CampaignVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface Sublist {
  id: string;
  name: string;
  capacity: number;
  position: number;
  campaigns: Campaign[];
}

export interface Screen {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  maxSpots: number;
  turnOnAt: string;
  turnOffAt: string;
  position: number;
  aliases: string[];
  imageThumbnailUrl: string | null;
  lastChange: { client: string; action: string; at: string | null } | null;
  sublists: Sublist[];
}

export interface PantallasSettings {
  spotsPerHour: number;
  minHours: number;
}

export interface PantallasBoard {
  settings: PantallasSettings;
  screens: Screen[];
}

export interface PantallasLog {
  id: string;
  type: PantallasLogType;
  client: string;
  campaign: string | null;
  screenName: string;
  sublistName: string | null;
  spotsPerDay: number | null;
  startDate: string | null;
  endDate: string | null;
  previousEndDate: string | null;
  previousSpotsPerDay: number | null;
  detail: string | null;
  orderGroupId: string | null;
  newSublist: boolean;
  actorName: string | null;
  createdAt: string;
}

export interface CampaignInput {
  client: string;
  campaign: string;
  startDate: string | null;
  endDate: string | null;
  spotsPerDay: number;
  notes: string;
  paused: boolean;
  pauseReason: string;
  art: CampaignArt;
  deal: CampaignDeal;
  monthlyValue: number | null;
  spotValue: number | null;
  totalValue?: number | null;
  versions: CampaignVersion[];
  alsoScreenIds: string[];
  refDate?: string;
}

export interface PlacementResult {
  placed: boolean;
  screenId: string;
  screenName: string;
  sublistName: string;
  newSublist: boolean;
  needsMoreHours: boolean;
  campaignId: string | null;
}

export interface OrderScreenInput {
  screenId: string;
  spotsPerDay: number;
  monthlyValue: number | null;
  spotValue: number | null;
  deal: CampaignDeal;
}

export interface IngestOrderInput {
  client: string;
  campaign: string;
  startDate: string | null;
  endDate: string | null;
  notes: string;
  art: CampaignArt;
  screens: OrderScreenInput[];
  refDate?: string;
}

export interface ScreenInput {
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  maxSpots: number;
  turnOnAt: string;
  turnOffAt: string;
  aliases: string[];
  imageBase64?: string;
}

export type OrderStatus = "PENDING" | "INGESTED" | "RETURNED";

export type OrderArtFormat = "ANIMATED" | "STATIC" | "VIDEO";

export interface DigitalOrderScreen {
  screenId: string | null;
  screenName: string;
  spotsPerDay: number;
  monthlyValue: number | null;
  spotValue: number | null;
  spotValueManual: boolean;
  deal: CampaignDeal;
}

export interface DigitalOrder {
  id: string;
  code: string;
  revision: number;
  status: OrderStatus;
  executive: string;
  entryDate: string;
  hasAgency: boolean;
  agencyName: string | null;
  client: string;
  campaign: string;
  artFormat: OrderArtFormat;
  startDate: string;
  endDate: string;
  links: string[];
  instructions: string | null;
  totalValue: number;
  monthlyValue: number;
  returnReason: string | null;
  returnedAt: string | null;
  ingestedAt: string | null;
  ingestedBy: string | null;
  orderGroupId: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  screens: DigitalOrderScreen[];
}

export interface SaveOrderScreenInput {
  screenId: string;
  spotsPerDay: number;
  monthlyValue: number | null;
  spotValue: number | null;
  spotValueManual: boolean;
  deal: CampaignDeal;
}

export interface SaveOrderInput {
  executive: string;
  entryDate: string;
  hasAgency: boolean;
  agencyName: string;
  client: string;
  campaign: string;
  artFormat: OrderArtFormat;
  startDate: string;
  endDate: string;
  links: string[];
  instructions: string;
  monthlyValue: number | null;
  screens: SaveOrderScreenInput[];
}
