export interface ExpiringContract {
  contractNumber: string;
  contractSourceId: number;
  customerName: string;
  customerEmail: string | null;
  sellerName: string | null;
  endDate: Date;
  totalBillboards: number;
  billboardCodes: string[];
}

export interface ExpiringContractsResult {
  data: ExpiringContract[];
  total: number;
  truncated: boolean;
}
