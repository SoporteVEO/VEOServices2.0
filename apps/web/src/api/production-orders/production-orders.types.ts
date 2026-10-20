export type ProductionOrderStatus =
  | "RECEIVED"
  | "IN_PRODUCTION"
  | "COMPLETED"
  | "CANCELLED";

/** Deprecated documents, only downloadable on older orders. */
export type ProductionDocumentKind = "PRODUCTION" | "DESIGN";

export interface ProductionOrderArt {
  fileName: string;
  mimeType: string;
  uploadedAt: string;
}

export interface InstallerSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: "INSTALLER" | "INSTALLER_MANTENIMIENTO" | "WORKER";
}

export interface ProductionOrderItem {
  id: string;
  offerItemId: string | null;
  billboardId: number | null;
  status: ProductionOrderStatus;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
  art: ProductionOrderArt | null;
  artLinkUrl: string | null;
  hasProductionDocument: boolean;
  hasDesignDocument: boolean;
  assignedInstaller: InstallerSummary | null;
  assignedVulcanizador: InstallerSummary | null;
  scheduledInstallationAt: string | null;
  installedAt: string | null;
  hasVulcanizadoImage: boolean;
  installationImageCount: number;
  printSchedule: ItemPrintSchedule | null;
  /** Latest request not withdrawn by its author, pending or answered. */
  latestRescheduleRequest: PrintRescheduleRequest | null;
  createdAt: string;
  updatedAt: string;
}

export type PrintScheduleStatus =
  | "SCHEDULED"
  | "SETUP"
  | "PRINTING"
  | "COOLDOWN"
  | "COMPLETED";

export interface ItemPrintSchedule {
  jobId: string;
  status: PrintScheduleStatus;
  machineName: string;
  scheduledStartAt: string;
  /** When the press starts printing, once the set up is done. */
  printStartAt: string;
  scheduledEndAt: string;
  printMinutes: number;
  plannedTotalMinutes: number;
  printStartedAt: string | null;
  completedAt: string | null;
}

export type PrintRescheduleStatus =
  | "PENDING"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string | null;
}

export interface PrintRescheduleRequest {
  id: string;
  productionOrderItemId: string;
  status: PrintRescheduleStatus;
  isUrgent: boolean;
  preferredDate: string | null;
  reason: string;
  previousStartAt: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  requestedBy: PersonSummary;
  resolvedBy: PersonSummary | null;
}

/** A pending request as the production team sees it. */
export interface PrintRescheduleQueueItem extends PrintRescheduleRequest {
  productionOrderId: string;
  orderNumber: string;
  customerName: string;
  customerCompany: string | null;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  width: number | null;
  height: number | null;
  printSchedule: ItemPrintSchedule | null;
}

export interface ProductionOrder {
  id: string;
  offerId: string | null;
  /** Offer number for offer-based orders, `ODP0001/26` for manual ones. */
  orderNumber: string;
  isManual: boolean;
  customerName: string;
  customerCompany: string | null;
  advisorFullName: string | null;
  notes: string | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
  itemCount: number;
  aggregateStatus: ProductionOrderStatus;
  statusCounts: Record<ProductionOrderStatus, number>;
  items: ProductionOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProductionOrders {
  data: ProductionOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateProductionOrderItemInput {
  billboardId: number;
  billboardCode?: string | null;
  address?: string | null;
  cityName?: string | null;
  departmentName?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface CreateProductionOrderInput {
  customerName: string;
  customerCompany?: string;
  notes?: string;
  items: CreateProductionOrderItemInput[];
}

export interface ProductionOrdersQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: ProductionOrderStatus;
  hideFinished?: boolean;
}
