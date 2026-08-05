export type ProductionOrderStatus =
  | "RECEIVED"
  | "IN_PRODUCTION"
  | "COMPLETED"
  | "CANCELLED";

export type ProductionDocumentKind = "PRODUCTION" | "DESIGN";

export interface ProductionOrderItem {
  id: string;
  offerItemId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ProductionOrder {
  id: string;
  offerId: string;
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  advisorFullName: string | null;
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

export interface ProductionOrdersQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: ProductionOrderStatus;
}
