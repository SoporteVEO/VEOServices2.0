import type { ActiveContract } from "@/api/contracts/contracts.get";

export interface MaintenanceContractGroup {
  contractNumber: string;
  contractSourceId: number;
  description: string;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  billboards: ActiveContract[];
  totalBillboards: number;
  totalImages: number;
  billboardsWithImages: number;
}

export function groupContractsByNumber(
  contracts: ActiveContract[],
): MaintenanceContractGroup[] {
  const map = new Map<string, ActiveContract[]>();

  for (const contract of contracts) {
    const key = contract.contractNumber;
    const existing = map.get(key);
    if (existing) {
      existing.push(contract);
    } else {
      map.set(key, [contract]);
    }
  }

  const groups = Array.from(map.entries()).map(([contractNumber, billboards]) => {
    const first = billboards[0];
    const startDate = billboards.reduce(
      (min, b) => (b.startDate < min ? b.startDate : min),
      first.startDate,
    );
    const endDate = billboards.reduce(
      (max, b) => (b.endDate > max ? b.endDate : max),
      first.endDate,
    );
    const totalImages = billboards.reduce((sum, b) => sum + b.images.length, 0);
    const billboardsWithImages = billboards.filter(
      (b) => b.images.length > 0,
    ).length;

    return {
      contractNumber,
      contractSourceId: first.contractSourceId,
      description: first.description,
      customerName: first.customerName,
      customerEmail: first.customerEmail,
      startDate,
      endDate,
      billboards,
      totalBillboards: billboards.length,
      totalImages,
      billboardsWithImages,
    };
  });

  return groups.sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
}
