import { pdf } from "@react-pdf/renderer";
import { getBillboardImageUrl } from "@/api/billboards/billboards.get";
import type { AvailableBillboardReport } from "@/api/billboards/billboards.types";
import { loadReportImage } from "@/components/pages/reports/pdf/contract-report-pdf-images";
import { parseYYYYMMDD } from "@/lib/format";
import { downloadBlob, safeFileName } from "@/lib/pdf-download";
import type { AvailabilityPdfBillboard } from "./availability-report-data";
import { AvailabilityReportPdfDocument } from "./availability-report-pdf-document";

export interface ReportProgress {
  stage: string;
  current: number;
  total: number;
}

interface AvailabilityReportOptions {
  billboards: AvailableBillboardReport[];
  /** `YYYY-MM-DD`, first day of the requested range. */
  dateFrom: string;
  onProgress?: (progress: ReportProgress) => void;
}

const IMAGE_BATCH_SIZE = 8;
/** The photo boxes are ~720 px wide; 1400 px stays sharp and keeps big decks light. */
const MAX_IMAGE_EDGE = 1400;

function billboardPhotoUrl(billboard: AvailableBillboardReport): string | null {
  return getBillboardImageUrl(billboard.imageId);
}

async function loadImages(
  billboards: AvailableBillboardReport[],
  onProgress?: (progress: ReportProgress) => void,
): Promise<Map<string, string>> {
  const urls = [
    ...new Set(billboards.map(billboardPhotoUrl).filter((u): u is string => !!u)),
  ];
  const images = new Map<string, string>();

  onProgress?.({ stage: "Descargando imágenes", current: 0, total: urls.length });

  for (let i = 0; i < urls.length; i += IMAGE_BATCH_SIZE) {
    const batch = urls.slice(i, i + IMAGE_BATCH_SIZE);
    const loaded = await Promise.all(batch.map((url) => loadReportImage(url, MAX_IMAGE_EDGE)));
    batch.forEach((url, index) => {
      const image = loaded[index];
      if (image) images.set(url, image);
    });
    onProgress?.({
      stage: "Descargando imágenes",
      current: Math.min(i + IMAGE_BATCH_SIZE, urls.length),
      total: urls.length,
    });
  }

  return images;
}

function toPdfBillboard(
  billboard: AvailableBillboardReport,
  images: Map<string, string>,
): AvailabilityPdfBillboard {
  const photoUrl = billboardPhotoUrl(billboard);
  return {
    code: billboard.billboardCode ?? "",
    address: billboard.address ?? billboard.reference ?? "",
    cityName: billboard.cityName,
    departmentName: billboard.departmentName,
    width: billboard.width,
    height: billboard.height,
    latitude: billboard.latitude,
    longitude: billboard.longitude,
    price: billboard.price,
    impressionPrice: billboard.impressionPrice ?? billboard.price,
    image: photoUrl ? (images.get(photoUrl) ?? null) : null,
  };
}

export async function generateAvailabilityReport(options: AvailabilityReportOptions) {
  const { billboards, dateFrom, onProgress } = options;
  const availableFrom = parseYYYYMMDD(dateFrom) ?? new Date();

  const images = await loadImages(billboards, onProgress);

  onProgress?.({ stage: "Generando PDF", current: 0, total: 1 });

  const blob = await pdf(
    <AvailabilityReportPdfDocument
      data={{
        availableFrom,
        billboards: billboards.map((b) => toPdfBillboard(b, images)),
      }}
    />,
  ).toBlob();

  const day = String(availableFrom.getDate()).padStart(2, "0");
  const month = String(availableFrom.getMonth() + 1).padStart(2, "0");
  downloadBlob(
    blob,
    safeFileName(`Disponibilidad ${day}-${month}-${availableFrom.getFullYear()}.pdf`),
  );

  onProgress?.({ stage: "Completado", current: 1, total: 1 });
}
