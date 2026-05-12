export interface AvailableBillboard {
  billboardId: number;
  billboardCode: string | null;
  reference: string | null;
  address: string | null;
  departmentId: number | null;
  departmentName: string | null;
  cityName: string | null;
  streetName: string | null;
  height: number | null;
  width: number | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  imageId: number | null;
  imageDate: Date | null;
  imageNotes: string | null;
  monthsWithoutPurchase: number | null;
  availableDiscount: number | null;
  totalPrice: number | null;
  isAvailable: boolean;
}

/** Same as {@link AvailableBillboard} without image fields (listing / dashboard). */
export type AvailableBillboardListing = Omit<
  AvailableBillboard,
  'imageId' | 'imageDate' | 'imageNotes'
>;

/** Extended billboard data used for report generation (includes impression price). */
export interface AvailableBillboardReport extends AvailableBillboard {
  impressionPrice: number | null;
}

export interface AvailableState {
  departmentId: number;
  departmentName: string;
  availableCount: number;
}

export interface BillboardContractHistoryItem {
  contractSourceId: number;
  contractDetailSourceId: number;
  contractNumber: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  customerName: string | null;
  customerEmail: string | null;
  price: number | null;
}

export interface BillboardImageItem {
  imageId: number;
  uploadedAt: Date | null;
  notes: string | null;
}

export interface DashboardKpis {
  totalBillboards: number;
  occupiedBillboards: number;
  availableBillboards: number;
  occupancyRate: number;
  totalContracts: number;
  activeContractsToday: number;
  endingSoon: number;
  uniqueCustomers: number;
  estimatedRevenue: number;
  averageContractValue: number;
  totalContractDays: number;
}

export interface DashboardMonthlyTrend {
  monthKey: string;
  contractsStarted: number;
  contractsActive: number;
  estimatedRevenue: number;
}

export interface DashboardYoyTrend {
  /** Month key for the current period, format `YYYY-MM`. */
  monthKey: string;
  /** Estimated revenue for this month in the current period. */
  current: number;
  /** Estimated revenue for the same month one year earlier. */
  previous: number;
}

export interface DashboardTopCustomer {
  name: string;
  email: string | null;
  contractsCount: number;
  estimatedSpent: number;
  lastContractEnd: Date | null;
}

export interface DashboardTopBillboard {
  billboardId: number;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  contractsCount: number;
  occupiedDays: number;
  estimatedRevenue: number;
  monthlyPrice: number | null;
}

export interface DashboardDepartmentBreakdown {
  departmentId: number | null;
  departmentName: string | null;
  totalBillboards: number;
  occupiedBillboards: number;
  contractsCount: number;
  estimatedRevenue: number;
}

export interface BillboardDashboardAnalytics {
  kpis: DashboardKpis;
  monthlyTrend: DashboardMonthlyTrend[];
  yoyTrend: DashboardYoyTrend[];
  topCustomers: DashboardTopCustomer[];
  topBillboards: DashboardTopBillboard[];
  byDepartment: DashboardDepartmentBreakdown[];
}

export interface AvailableDigitalBillboard {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  maxSpots: number;
  spotsUsed: number;
  spotsRemaining: number;
  imageUrl: string | null;
  departmentId: number | null;
  departmentName: string | null;
}
