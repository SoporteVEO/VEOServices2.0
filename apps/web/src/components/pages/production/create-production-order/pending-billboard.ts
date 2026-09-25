import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { uploadProductionOrderDocument } from "@/api/production-orders/production-orders.patch";
import type {
  CreateProductionOrderItemInput,
  ProductionDocumentKind,
  ProductionOrder,
} from "@/api/production-orders/production-orders.types";
import { fileToBase64 } from "@/components/pages/production-orders-shared/production-order-pdf";

export interface PendingBillboard {
  billboard: AvailableBillboardListing;
  productionDocument: File | null;
  designDocument: File | null;
}

export function toPendingBillboard(
  billboard: AvailableBillboardListing,
): PendingBillboard {
  return { billboard, productionDocument: null, designDocument: null };
}

export function withDocument(
  entry: PendingBillboard,
  kind: ProductionDocumentKind,
  file: File | null,
): PendingBillboard {
  return kind === "PRODUCTION"
    ? { ...entry, productionDocument: file }
    : { ...entry, designDocument: file };
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
  kind: ProductionDocumentKind;
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
    if (!itemId) return [];
    const uploads: PendingUpload[] = [];
    if (entry.productionDocument) {
      uploads.push({ itemId, kind: "PRODUCTION", file: entry.productionDocument });
    }
    if (entry.designDocument) {
      uploads.push({ itemId, kind: "DESIGN", file: entry.designDocument });
    }
    return uploads;
  });
}

export function countPendingDocuments(entries: PendingBillboard[]): number {
  return entries.reduce(
    (total, entry) =>
      total + Number(!!entry.productionDocument) + Number(!!entry.designDocument),
    0,
  );
}

/**
 * Uploads one PDF at a time so a large batch never exceeds the API body limit.
 * Resolves with the number of files that failed; the order is already created
 * by then, so failures can be retried from the detail drawer.
 */
export async function uploadPendingDocuments(
  order: ProductionOrder,
  entries: PendingBillboard[],
  onProgress: (done: number, total: number) => void,
): Promise<number> {
  const uploads = collectUploads(order, entries);
  let failed = 0;

  for (const [index, upload] of uploads.entries()) {
    onProgress(index, uploads.length);
    try {
      const pdfBase64 = await fileToBase64(upload.file);
      await uploadProductionOrderDocument({
        itemId: upload.itemId,
        kind: upload.kind,
        pdfBase64,
      });
    } catch {
      failed += 1;
    }
  }

  return failed;
}
