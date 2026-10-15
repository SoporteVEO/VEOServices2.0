import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { uploadProductionOrderArt } from "@/api/production-orders/production-orders.patch";
import type {
  CreateProductionOrderItemInput,
  ProductionOrder,
} from "@/api/production-orders/production-orders.types";

export interface PendingBillboard {
  billboard: AvailableBillboardListing;
  art: File | null;
}

export function toPendingBillboard(
  billboard: AvailableBillboardListing,
): PendingBillboard {
  return { billboard, art: null };
}

export function toCreateItemInput({
  billboard,
}: PendingBillboard): CreateProductionOrderItemInput {
  return {
    billboardId: billboard.billboardId,
    billboardCode: billboard.billboardCode,
    address: billboard.address,
    cityName: billboard.cityName,
    departmentName: billboard.departmentName,
    width: billboard.width,
    height: billboard.height,
  };
}

interface PendingUpload {
  itemId: string;
  file: File;
}

function collectUploads(
  order: ProductionOrder,
  entries: PendingBillboard[],
): PendingUpload[] {
  const itemIdByBillboard = new Map(
    order.items.map((item) => [item.billboardId, item.id]),
  );

  return entries.flatMap((entry) => {
    const itemId = itemIdByBillboard.get(entry.billboard.billboardId);
    return itemId && entry.art ? [{ itemId, file: entry.art }] : [];
  });
}

export function countPendingArts(entries: PendingBillboard[]): number {
  return entries.filter((entry) => entry.art).length;
}

/**
 * Uploads one art at a time. Resolves with the number of files that failed;
 * the order is already created by then, so failures can be retried from the
 * detail drawer.
 */
export async function uploadPendingArts(
  order: ProductionOrder,
  entries: PendingBillboard[],
  onProgress: (done: number, total: number) => void,
): Promise<number> {
  const uploads = collectUploads(order, entries);
  let failed = 0;

  for (const [index, upload] of uploads.entries()) {
    onProgress(index, uploads.length);
    try {
      await uploadProductionOrderArt(upload);
    } catch {
      failed += 1;
    }
  }

  return failed;
}
