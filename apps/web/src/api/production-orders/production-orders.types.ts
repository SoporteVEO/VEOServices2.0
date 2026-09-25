export type ProductionOrderStatus =
  | "RECEIVED"
  | "IN_PRODUCTION"
  | "COMPLETED"
  | "CANCELLED";

export type ProductionDocumentKind = "PRODUCTION" | "DESIGN";

export interface InstallerSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: "INSTALLER" | "WORKER";
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
  hasProductionDocument: boolean;
  hasDesignDocument: boolean;
  assignedInstaller: InstallerSummary | null;
  scheduledInstallationAt: string | null;
  installedAt: string | null;
  hasVulcanizadoImage: boolean;
  installationImageCount: number;
  createdAt: string;
  updatedAt: string;
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
}
