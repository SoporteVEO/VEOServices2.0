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
  sellerId: number | null;
  sellerCode: string | null;
  sellerName: string;
};

export type SalesByCostCenterReport = {
  range: { from: string; to: string };
  total: number;
  rows: SalesByCostCenterRow[];
};
