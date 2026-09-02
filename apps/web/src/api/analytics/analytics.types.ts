export type UserAppUsageDailyRow = {
  date: string;
  totalMs: number;
  activeUserCount: number;
};

export type UserAppUsageUserRow = {
  userId: string;
  publicId: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: string;
  disabled: boolean;
  totalMs: number;
  activeDays: number;
};

export type UserAppUsageReport = {
  range: { from: string; to: string };
  daily: UserAppUsageDailyRow[];
  users: UserAppUsageUserRow[];
};

export type SalesByCostCenterRow = {
  invoiceId: number;
  guid: string;
  documentType: string;
  documentNumber: string | null;
  date: string;
  customerId: number | null;
  customerName: string;
  total: number;
  costCenterId: number | null;
  costCenterCode: string | null;
  costCenterName: string;
  subCostCenterId: number | null;
  subCostCenterCode: string | null;
  subCostCenterName: string | null;
  tipoVentaId: number | null;
  tipoVentaName: string;
  sellerId: number | null;
  sellerCode: string | null;
  sellerName: string;
};

export type SalesByCostCenterReport = {
  range: { from: string; to: string };
  total: number;
  rows: SalesByCostCenterRow[];
};

export type OffersAnalyticsStatusBreakdown = {
  count: number;
  totalAmount: number;
  totalRental: number;
  totalImpression: number;
};

export type OffersAnalyticsTotals = {
  count: number;
  totalAmount: number;
  totalRental: number;
  totalImpression: number;
  uniqueCustomers: number;
  uniqueCreators: number;
  averageTicket: number;
  conversionRate: number;
  averageItemsPerOffer: number;
};

export type OffersAnalyticsDailyPoint = {
  dateKey: string;
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  totalAmount: number;
  pendingAmount: number;
  acceptedAmount: number;
  declinedAmount: number;
};

export type OffersAnalyticsMonthlyPoint = {
  monthKey: string;
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  totalAmount: number;
  pendingAmount: number;
  acceptedAmount: number;
  declinedAmount: number;
};

export type OffersAnalyticsByUserRow = {
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  totalOffers: number;
  pendingCount: number;
  acceptedCount: number;
  declinedCount: number;
  totalAmount: number;
  pendingAmount: number;
  acceptedAmount: number;
  declinedAmount: number;
};

export type OffersAnalyticsTopBillboardRow = {
  groupKey: string;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  occurrences: number;
  totalQuantity: number;
  totalAmount: number;
};

export type OffersAnalyticsTopCustomerRow = {
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  totalOffers: number;
  totalAmount: number;
  acceptedAmount: number;
};

export type OffersAnalyticsOverview = {
  range: { from: string; to: string };
  totals: OffersAnalyticsTotals;
  byStatus: {
    pending: OffersAnalyticsStatusBreakdown;
    accepted: OffersAnalyticsStatusBreakdown;
    declined: OffersAnalyticsStatusBreakdown;
  };
  daily: OffersAnalyticsDailyPoint[];
  monthly: OffersAnalyticsMonthlyPoint[];
  byUser: OffersAnalyticsByUserRow[];
  topBillboards: OffersAnalyticsTopBillboardRow[];
  topCustomers: OffersAnalyticsTopCustomerRow[];
};

export type OffersAnalyticsListItem = {
  id: string;
  offerNumber: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  itemCount: number;
  totalRental: number;
  totalImpression: number;
  totalAmount: number;
  validUntil: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
};

export type OffersAnalyticsList = {
  data: OffersAnalyticsListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ReportsAnalyticsTypeBreakdown = {
  count: number;
  distinctContracts: number;
  distinctUsers: number;
};

export type ReportsAnalyticsTotals = {
  total: number;
  monthly: number;
  installation: number;
  maintenance: number;
  distinctUsers: number;
  distinctContracts: number;
  averagePerDay: number;
};

export type ReportsAnalyticsTrendPoint = {
  key: string;
  total: number;
  monthly: number;
  installation: number;
  maintenance: number;
};

export type ReportsAnalyticsByUserRow = {
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  totalReports: number;
  monthlyCount: number;
  installationCount: number;
  maintenanceCount: number;
};

export type ReportsAnalyticsCoverageRow = {
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  activeContracts: number;
  monthlyReportsSent: number;
  pending: number;
  coverage: number;
};

export type ReportsAnalyticsCurrentMonthCompliance = {
  monthKey: string;
  rangeFrom: string;
  rangeTo: string;
  activeContractsTotal: number;
  monthlyReportsSent: number;
  pending: number;
  coverage: number;
  perUser: ReportsAnalyticsCoverageRow[];
};

export type ReportsAnalyticsOverview = {
  range: { from: string; to: string };
  totals: ReportsAnalyticsTotals;
  byType: {
    monthly: ReportsAnalyticsTypeBreakdown;
    installation: ReportsAnalyticsTypeBreakdown;
    maintenance: ReportsAnalyticsTypeBreakdown;
  };
  daily: ReportsAnalyticsTrendPoint[];
  monthly: ReportsAnalyticsTrendPoint[];
  monthlyYear: ReportsAnalyticsTrendPoint[];
  byUser: ReportsAnalyticsByUserRow[];
  currentMonthCompliance: ReportsAnalyticsCurrentMonthCompliance;
};

export type PrintingAnalyticsTotals = {
  jobs: number;
  scheduled: number;
  running: number;
  completed: number;
  cancelled: number;
  plannedHours: number;
  actualHours: number;
  plannedPrintHours: number;
  actualPrintHours: number;
  actualSetupHours: number;
  actualCooldownHours: number;
  avgSetupMinutes: number;
  avgPrintMinutes: number;
  avgCooldownMinutes: number;
  avgJobMinutes: number;
  avgStartDelayMinutes: number;
  onTimeStartRate: number;
  planAccuracy: number;
  utilization: number;
  squareMeters: number;
  minutesPerSquareMeter: number;
  activeMachines: number;
  availableHours: number;
};

export type PrintingAnalyticsMachineRow = {
  machineId: string;
  machineName: string;
  isActive: boolean;
  jobs: number;
  completed: number;
  cancelled: number;
  plannedHours: number;
  actualHours: number;
  actualSetupHours: number;
  actualPrintHours: number;
  actualCooldownHours: number;
  utilization: number;
  avgSetupMinutes: number;
  avgPrintMinutes: number;
  avgCooldownMinutes: number;
  avgStartDelayMinutes: number;
  onTimeStartRate: number;
  planAccuracy: number;
  squareMeters: number;
};

export type PrintingAnalyticsDailyPoint = {
  dateKey: string;
  jobs: number;
  completed: number;
  plannedHours: number;
  actualHours: number;
  setupHours: number;
  printHours: number;
  cooldownHours: number;
  squareMeters: number;
};

export type PrintingAnalyticsSizeRow = {
  sizeKey: string;
  width: number | null;
  height: number | null;
  jobs: number;
  completed: number;
  avgPlannedPrintMinutes: number;
  avgActualPrintMinutes: number;
  totalPrintHours: number;
  squareMeters: number;
};

export type PrintingAnalyticsHourPoint = {
  hour: number;
  jobsStarted: number;
  printHours: number;
};

export type PrintingAnalyticsOrderRow = {
  productionOrderId: string;
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  jobs: number;
  completed: number;
  plannedHours: number;
  actualHours: number;
  squareMeters: number;
};

export type PrintingAnalyticsCustomerRow = {
  customerName: string;
  customerCompany: string | null;
  jobs: number;
  actualHours: number;
  squareMeters: number;
};

export type PrintingAnalyticsMachineOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export type PrintingAnalyticsOverview = {
  range: { from: string; to: string };
  machines: PrintingAnalyticsMachineOption[];
  totals: PrintingAnalyticsTotals;
  phaseSplit: { setupHours: number; printHours: number; cooldownHours: number };
  byMachine: PrintingAnalyticsMachineRow[];
  daily: PrintingAnalyticsDailyPoint[];
  bySize: PrintingAnalyticsSizeRow[];
  byHour: PrintingAnalyticsHourPoint[];
  topOrders: PrintingAnalyticsOrderRow[];
  topCustomers: PrintingAnalyticsCustomerRow[];
};
