import { pdf } from "@react-pdf/renderer";
import {
  getAvailableBillboardsForReport,
  getBillboardImageUrl,
} from "@/api/billboards/billboards.get";
import type { AvailableBillboardReport } from "@/api/billboards/billboards.types";
import { formatDateRange } from "@/lib/format";
import { safeFileName } from "@/lib/pdf-download";
import type { ContractReportProgress } from "../generate-contract-report";
import { loadReportImage } from "../contract-report-pdf-images";
import { ClientProposalPdfDocument } from "./client-proposal-pdf-document";
import type { ProposalPdfBillboard } from "./client-proposal-pdf-data";

const IMAGE_BATCH_SIZE = 6;

export interface ClientProposalOptions {
  company: string;
  contact?: { name?: string; role?: string; email?: string };
  objective: string;
  from: string;
  to: string;
  brandSummary: string;
  audience?: string;
  strategy: string[];
  billboards: { code: string; billboardId: number; reason: string }[];
  preparedBy: string;
  preparedByEmail: string;
  createdAt: string;
  onProgress?: (progress: ContractReportProgress) => void;
}

export interface ClientProposalResult {
  blob: Blob;
  fileName: string;
  /** Codes that stopped being available since Nexo picked them. */
  skippedCodes: string[];
}

function photoUrl(billboard: AvailableBillboardReport): string | null {
  return billboard.s3ImageUrl ?? getBillboardImageUrl(billboard.imageId);
}

async function loadPhotos(
  billboards: AvailableBillboardReport[],
  onProgress?: (progress: ContractReportProgress) => void,
): Promise<Map<number, string | null>> {
  const photos = new Map<number, string | null>();
  onProgress?.({ stage: "Descargando fotografías", current: 0, total: billboards.length });
  for (let i = 0; i < billboards.length; i += IMAGE_BATCH_SIZE) {
    const batch = billboards.slice(i, i + IMAGE_BATCH_SIZE);
    const images = await Promise.all(
      batch.map((b) => {
        const url = photoUrl(b);
        return url ? loadReportImage(url) : Promise.resolve(null);
      }),
    );
    batch.forEach((b, index) => photos.set(b.billboardId, images[index] ?? null));
    onProgress?.({
      stage: "Descargando fotografías",
      current: Math.min(i + IMAGE_BATCH_SIZE, billboards.length),
      total: billboards.length,
    });
  }
  return photos;
}

export async function generateClientProposal(
  options: ClientProposalOptions,
): Promise<ClientProposalResult> {
  const { onProgress } = options;
  onProgress?.({ stage: "Cargando vallas", current: 0, total: 1 });

  const rows = await getAvailableBillboardsForReport({
    from: options.from,
    to: options.to,
    billboardIds: options.billboards.map((b) => b.billboardId),
  });
  const byId = new Map(rows.map((row) => [row.billboardId, row]));
  const selected = options.billboards.filter((b) => byId.has(b.billboardId));
  if (selected.length === 0) {
    throw new Error("Las vallas de la propuesta ya no están disponibles en ese periodo.");
  }

  const photos = await loadPhotos(
    selected.map((b) => byId.get(b.billboardId)!),
    onProgress,
  );

  const billboards: ProposalPdfBillboard[] = selected.map((pick) => {
    const row = byId.get(pick.billboardId)!;
    return {
      code: row.billboardCode ?? pick.code,
      address: row.address ?? "",
      reference: row.reference,
      city: row.cityName,
      department: row.departmentName,
      width: row.width,
      height: row.height,
      monthlyPrice: row.price,
      latitude: row.latitude,
      longitude: row.longitude,
      image: photos.get(row.billboardId) ?? null,
      reason: pick.reason,
    };
  });

  onProgress?.({ stage: "Generando PDF", current: 0, total: 1 });
  const period = formatDateRange(
    `${options.from}T00:00:00`,
    `${options.to}T00:00:00`,
  );
  const blob = await pdf(
    <ClientProposalPdfDocument
      data={{
        company: options.company,
        contactName: options.contact?.name?.trim() || null,
        contactRole: options.contact?.role?.trim() || "Gerente de Marketing",
        contactEmail: options.contact?.email?.trim() || null,
        objective: options.objective,
        period,
        brandSummary: options.brandSummary,
        audience: options.audience?.trim() || null,
        strategy: options.strategy,
        billboards,
        monthlyInvestment: billboards.reduce((sum, b) => sum + (b.monthlyPrice ?? 0), 0),
        preparedBy: options.preparedBy,
        preparedByEmail: options.preparedByEmail,
        createdAt: new Date(options.createdAt),
      }}
    />,
  ).toBlob();
  onProgress?.({ stage: "Completado", current: 1, total: 1 });

  return {
    blob,
    fileName: safeFileName(`Propuesta VEO - ${options.company}.pdf`).trim(),
    skippedCodes: options.billboards
      .filter((b) => !byId.has(b.billboardId))
      .map((b) => b.code),
  };
}
