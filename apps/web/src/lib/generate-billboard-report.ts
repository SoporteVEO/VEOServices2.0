import type { AvailableBillboardReport } from "@/api/billboards/billboards.types";
import { getBillboardImageUrl } from "@/api/billboards/billboards.get";
import { getMapsUrl } from "./utils";
import { formatPrice, formatDimensions } from "./format";

const BRAND_DARK = "003366";
const BRAND_ACCENT = "0066CC";
const LABEL_COLOR = "003366";
const VALUE_COLOR = "333333";
const WHITE = "FFFFFF";
const LIGHT_BG = "F0F4F8";

const SLIDE_W = 13.33;
const SLIDE_H = 7.5;

const INTRO_SLIDE_PATHS = [
  "/slide1.png",
  "/slide2.png",
  "/slide3.png",
  "/slide4.png",
];
const OUTRO_SLIDE_PATH = "/lastSlide.png";

export interface ReportProgress {
  stage: string;
  current: number;
  total: number;
}

interface ReportOptions {
  billboards: AvailableBillboardReport[];
  dateFrom: string;
  dateTo: string;
  onProgress?: (progress: ReportProgress) => void;
}

function formatReportDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateBillboardReport(options: ReportOptions) {
  const { billboards, dateFrom, dateTo, onProgress } = options;

  const PptxGenJS = (await import("pptxgenjs")).default;

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "VEO";
  pptx.company = "VEO Media";
  pptx.title = `Disponibilidad ${formatReportDate(dateFrom)}`;

  onProgress?.({ stage: "Cargando recursos", current: 0, total: 1 });

  const [introImages, outroImage] = await Promise.all([
    Promise.all(INTRO_SLIDE_PATHS.map(fetchImageAsBase64)),
    fetchImageAsBase64(OUTRO_SLIDE_PATH),
  ]);

  onProgress?.({ stage: "Descargando imágenes", current: 0, total: billboards.length });

  const imageMap = new Map<number, string>();
  const uniqueImageIds = [
    ...new Set(
      billboards
        .map((b) => b.imageId)
        .filter((id): id is number => id != null),
    ),
  ];

  const BATCH_SIZE = 6;
  for (let i = 0; i < uniqueImageIds.length; i += BATCH_SIZE) {
    const batch = uniqueImageIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (id) => {
        const url = getBillboardImageUrl(id);
        if (!url) return null;
        const base64 = await fetchImageAsBase64(url);
        return base64 ? { id, base64 } : null;
      }),
    );
    for (const r of results) {
      if (r) imageMap.set(r.id, r.base64);
    }
    onProgress?.({
      stage: "Descargando imágenes",
      current: Math.min(i + BATCH_SIZE, uniqueImageIds.length),
      total: uniqueImageIds.length,
    });
  }

  onProgress?.({ stage: "Generando presentación", current: 0, total: billboards.length });

  for (const img of introImages) {
    if (img) addFullImageSlide(pptx, img);
  }

  for (let i = 0; i < billboards.length; i++) {
    const bb = billboards[i]!;
    const imageBase64 = bb.imageId ? (imageMap.get(bb.imageId) ?? null) : null;
    addBillboardSlide(pptx, bb, imageBase64);
    if (i % 10 === 0) {
      onProgress?.({ stage: "Generando presentación", current: i + 1, total: billboards.length });
    }
  }

  if (outroImage) addFullImageSlide(pptx, outroImage);

  onProgress?.({ stage: "Guardando archivo", current: 0, total: 1 });

  const fileName = `Disponibilidad ${formatReportDate(dateFrom)}.pptx`;
  await pptx.writeFile({ fileName });

  onProgress?.({ stage: "Completado", current: 1, total: 1 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addFullImageSlide(pptx: any, imageBase64: string) {
  const slide = pptx.addSlide();
  slide.addImage({
    data: imageBase64,
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    sizing: { type: "cover", w: SLIDE_W, h: SLIDE_H },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addBillboardSlide(pptx: any, bb: AvailableBillboardReport, imageBase64: string | null) {
  const slide = pptx.addSlide();
  slide.background = { fill: WHITE };

  slide.addText(bb.billboardCode ?? "—", {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 0.85,
    fill: { color: BRAND_DARK },
    fontSize: 32,
    bold: true,
    color: WHITE,
    fontFace: "Arial",
    valign: "middle",
    margin: [0, 0, 0, 29],
  });

  const imgX = 0.35;
  const imgY = 1.1;
  const imgW = 7.0;
  const imgH = 5.9;

  if (imageBase64) {
    slide.addImage({
      data: imageBase64,
      x: imgX,
      y: imgY,
      w: imgW,
      h: imgH,
      sizing: { type: "contain", w: imgW, h: imgH },
    });
  } else {
    slide.addText("Sin imagen", {
      x: imgX,
      y: imgY,
      w: imgW,
      h: imgH,
      fill: { color: LIGHT_BG },
      fontSize: 18,
      color: "999999",
      align: "center",
      valign: "middle",
      fontFace: "Arial",
      line: { color: "DDDDDD", width: 1 },
    });
  }

  const panelX = 7.7;
  const panelW = 5.2;
  let y = 1.1;

  const addLabel = (label: string) => {
    slide.addText(label, {
      x: panelX,
      y,
      w: panelW,
      h: 0.28,
      fontSize: 10,
      bold: true,
      color: LABEL_COLOR,
      fontFace: "Arial",
    });
    y += 0.25;
  };

  const addValue = (value: string, extraHeight = 0) => {
    slide.addText(value, {
      x: panelX,
      y,
      w: panelW,
      h: 0.35 + extraHeight,
      fontSize: 13,
      color: VALUE_COLOR,
      fontFace: "Arial",
      wrap: true,
    });
    y += 0.4 + extraHeight;
  };

  const mapsUrl = getMapsUrl(bb.latitude, bb.longitude);
  if (mapsUrl) {
    addLabel("COORDENADAS:");
    slide.addText(
      [
        {
          text: mapsUrl,
          options: {
            hyperlink: { url: mapsUrl },
            fontSize: 9,
            color: BRAND_ACCENT,
          },
        },
      ],
      {
        x: panelX,
        y,
        w: panelW,
        h: 0.55,
        fontFace: "Arial",
        wrap: true,
      },
    );
    y += 0.6;
  }

  addLabel("IMPRESIÓN:");
  addValue(formatPrice(bb.impressionPrice ?? bb.price));

  addLabel("UBICACIÓN:");
  const address = bb.address ?? "—";
  const addrExtraH = address.length > 60 ? 0.25 : 0;
  addValue(address, addrExtraH);

  addLabel("MEDIDA:");
  addValue(formatDimensions(bb.width, bb.height));

  addLabel("CANON MENSUAL:");
  addValue(formatPrice(bb.price));

  if (bb.availableDiscount != null && bb.availableDiscount > 0) {
    addLabel("DESCUENTO:");
    addValue(`${bb.availableDiscount}%  →  ${formatPrice(bb.totalPrice)}`);
  }

  addLabel("DISPONIBILIDAD:");
  addValue("De Inmediato");
}
