import { pdf } from "@react-pdf/renderer";
import { safeFileName } from "@/lib/pdf-download";
import type { ReportPdfBillboard } from "./contract-report-pdf-data";
import { ContractReportPdfDocument } from "./contract-report-pdf-document";
import { loadReportImage } from "./contract-report-pdf-images";

export const CONTRACT_REPORT_MIME_TYPE = "application/pdf";

export interface ContractReportProgress {
  stage: string;
  current: number;
  total: number;
}

export interface ContractReportBillboard {
  billboardCode: string;
  billboardAddress: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  imageCreatedAt: string | null;
}

export interface ContractReportOptions {
  contractNumber: string;
  customerName: string;
  customerEmail: string;
  description: string;
  dateFrom: Date;
  dateTo: Date;
  billboards: ContractReportBillboard[];
  fileNamePrefix?: string;
  onProgress?: (progress: ContractReportProgress) => void;
}

export interface ContractReportResult {
  blob: Blob;
  fileName: string;
  period: string;
}

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const IMAGE_BATCH_SIZE = 6;

function formatPeriod(from: Date, to: Date): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  const fromLabel = `${MONTHS_ES[from.getMonth()]}${sameYear ? "" : ` ${from.getFullYear()}`}`;
  const toLabel = `${MONTHS_ES[to.getMonth()]} ${to.getFullYear()}`;
  return from.getMonth() === to.getMonth() && sameYear
    ? `${MONTHS_ES[from.getMonth()]} ${from.getFullYear()}`
    : `${fromLabel} – ${toLabel}`;
}

async function loadBillboardImages(
  billboards: ContractReportBillboard[],
  onProgress?: (progress: ContractReportProgress) => void,
): Promise<ReportPdfBillboard[]> {
  const withImage = billboards.filter((b) => !!b.imageUrl);
  const loaded: ReportPdfBillboard[] = [];

  onProgress?.({ stage: "Descargando imágenes", current: 0, total: withImage.length });

  for (let i = 0; i < withImage.length; i += IMAGE_BATCH_SIZE) {
    const batch = withImage.slice(i, i + IMAGE_BATCH_SIZE);
    const images = await Promise.all(batch.map((b) => loadReportImage(b.imageUrl!)));

    batch.forEach((billboard, index) => {
      const image = images[index];
      if (!image) return;
      loaded.push({
        code: billboard.billboardCode,
        address: billboard.billboardAddress,
        latitude: billboard.latitude,
        longitude: billboard.longitude,
        image,
        capturedAt: billboard.imageCreatedAt ? new Date(billboard.imageCreatedAt) : null,
      });
    });

    onProgress?.({
      stage: "Descargando imágenes",
      current: Math.min(i + IMAGE_BATCH_SIZE, withImage.length),
      total: withImage.length,
    });
  }

  return loaded;
}

export async function generateContractReport(
  options: ContractReportOptions,
): Promise<ContractReportResult> {
  const {
    contractNumber,
    customerName,
    customerEmail,
    description,
    dateFrom,
    dateTo,
    billboards,
    fileNamePrefix = "Reporte de Vallas",
    onProgress,
  } = options;

  const period = formatPeriod(dateFrom, dateTo);
  const included = await loadBillboardImages(billboards, onProgress);

  onProgress?.({ stage: "Generando PDF", current: 0, total: 1 });

  const blob = await pdf(
    <ContractReportPdfDocument
      data={{
        contractNumber,
        customerName,
        customerEmail,
        campaign: description.trim(),
        period,
        totalBillboards: billboards.length,
        billboards: included,
      }}
    />,
  ).toBlob();

  onProgress?.({ stage: "Completado", current: 1, total: 1 });

  return {
    blob,
    fileName: safeFileName(`${fileNamePrefix} - ${contractNumber} - ${period}.pdf`).trim(),
    period,
  };
}
