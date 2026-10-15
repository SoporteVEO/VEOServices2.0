import type { ActiveContractGroup } from "@/api/contracts/contracts.get";
import {
  createReportUploadUrl,
  sendMaintenanceReport,
} from "@/api/contracts/contracts.post";
import { uploadBlobToPresignedUrl } from "@/lib/upload-blob-to-presigned-url";
import {
  CONTRACT_REPORT_MIME_TYPE,
  generateContractReport,
  type ContractReportProgress,
  type ContractReportResult,
} from "./pdf/generate-contract-report";
import { endOfMonth } from "./report-period";
import { BILLBOARD_REPORT_CONFIG } from "./report-types";

/** Selected image per billboard, keyed by `contractDetailSourceId`. */
export type ReportImageSelection = Record<number, string | null>;

/** Each billboard starts with its most recent image of the month. */
export function buildInitialSelection(
  group: ActiveContractGroup,
): ReportImageSelection {
  const initial: ReportImageSelection = {};
  for (const billboard of group.billboards) {
    initial[billboard.contractDetailSourceId] = billboard.images[0]?.id ?? null;
  }
  return initial;
}

export function countSelectedBillboards(
  group: ActiveContractGroup,
  selection: ReportImageSelection,
): number {
  return group.billboards.filter((b) => selection[b.contractDetailSourceId])
    .length;
}

export function buildContractReport({
  group,
  month,
  selection,
  onProgress,
}: {
  group: ActiveContractGroup;
  month: Date;
  selection: ReportImageSelection;
  onProgress?: (progress: ContractReportProgress) => void;
}): Promise<ContractReportResult> {
  const billboards = group.billboards.map((billboard) => {
    const selectedId = selection[billboard.contractDetailSourceId];
    const image = selectedId
      ? (billboard.images.find((img) => img.id === selectedId) ?? null)
      : null;
    return {
      billboardCode: billboard.billboardCode,
      billboardAddress: billboard.billboardAddress ?? "",
      latitude: billboard.billboardLatitude,
      longitude: billboard.billboardLongitude,
      imageUrl: image?.url ?? null,
      imageCreatedAt: image?.createdAt ?? null,
    };
  });

  return generateContractReport({
    contractNumber: group.contractNumber,
    customerName: group.customerName ?? "",
    customerEmail: group.customerEmail ?? "",
    description: group.description ?? "",
    dateFrom: month,
    dateTo: endOfMonth(month),
    billboards,
    fileNamePrefix: BILLBOARD_REPORT_CONFIG.fileNamePrefix,
    onProgress,
  });
}

/** Uploads a generated report and emails it, registering it as sent. */
export async function sendContractReport({
  group,
  month,
  report,
  email,
  onProgress,
}: {
  group: ActiveContractGroup;
  month: Date;
  report: ContractReportResult;
  email: string;
  onProgress?: (progress: ContractReportProgress) => void;
}): Promise<void> {
  onProgress?.({ stage: "Subiendo reporte", current: 0, total: 1 });
  const { key, url } = await createReportUploadUrl();
  await uploadBlobToPresignedUrl({
    url,
    blob: report.blob,
    contentType: CONTRACT_REPORT_MIME_TYPE,
  });

  onProgress?.({ stage: "Enviando email", current: 0, total: 1 });
  await sendMaintenanceReport({
    email,
    contractNumber: group.contractNumber,
    customerName: group.customerName ?? "",
    description: group.description ?? undefined,
    period: report.period,
    periodStart: month.toISOString(),
    fileName: report.fileName,
    fileKey: key,
  });
}

export function formatReportProgress(
  progress: ContractReportProgress | null,
): string | null {
  if (!progress) return null;
  return `${progress.stage}${progress.total > 1 ? ` (${progress.current}/${progress.total})` : "…"}`;
}
