import { getMapsUrl } from "./utils";

const BRAND_DARK = "FE1C65";
const BRAND_ACCENT = "89DA00";
const LABEL_COLOR = "FE1C65";
const VALUE_COLOR = "333333";
const WHITE = "FAF9F6";

const SLIDE_W = 13.33;
const SLIDE_H = 7.5;

const INTRO_SLIDE_PATHS = [
  "/slide1.png",
  "/slide2.png",
  "/slide3.png",
  "/slide4.png",
];
const OUTRO_SLIDE_PATH = "/lastSlide.png";

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
  coverTitle?: string;
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

function formatPeriod(from: Date, to: Date): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  const fromLabel = `${MONTHS_ES[from.getMonth()]}${sameYear ? "" : ` ${from.getFullYear()}`}`;
  const toLabel = `${MONTHS_ES[to.getMonth()]} ${to.getFullYear()}`;
  return from.getMonth() === to.getMonth() && sameYear
    ? `${MONTHS_ES[from.getMonth()]} ${from.getFullYear()}`
    : `${fromLabel} – ${toLabel}`;
}

function sanitizeFileName(input: string): string {
  return input.replace(/[\\/:*?"<>|]/g, "-").trim();
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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
    coverTitle = "REPORTE DE MANTENIMIENTO",
    fileNamePrefix = "Mantenimiento",
    onProgress,
  } = options;

  const PptxGenJS = (await import("pptxgenjs")).default;

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "VEO";
  pptx.company = "VEO Media";
  pptx.title = `${fileNamePrefix} ${contractNumber}`;

  const period = formatPeriod(dateFrom, dateTo);

  onProgress?.({ stage: "Cargando recursos", current: 0, total: 1 });

  const [introImages, outroImage] = await Promise.all([
    Promise.all(INTRO_SLIDE_PATHS.map(fetchImageAsBase64)),
    fetchImageAsBase64(OUTRO_SLIDE_PATH),
  ]);

  onProgress?.({
    stage: "Descargando imágenes",
    current: 0,
    total: billboards.length,
  });

  const imageMap = new Map<string, string>();
  const billboardsWithImage = billboards.filter((b) => !!b.imageUrl);

  const BATCH_SIZE = 6;
  for (let i = 0; i < billboardsWithImage.length; i += BATCH_SIZE) {
    const batch = billboardsWithImage.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (b) => {
        if (!b.imageUrl) return null;
        const base64 = await fetchImageAsBase64(b.imageUrl);
        return base64 ? { code: b.billboardCode, base64 } : null;
      }),
    );
    for (const r of results) {
      if (r) imageMap.set(r.code, r.base64);
    }
    onProgress?.({
      stage: "Descargando imágenes",
      current: Math.min(i + BATCH_SIZE, billboardsWithImage.length),
      total: billboardsWithImage.length,
    });
  }

  const billboardsToInclude = billboards.filter((bb) =>
    imageMap.has(bb.billboardCode),
  );

  onProgress?.({
    stage: "Generando presentación",
    current: 0,
    total: billboardsToInclude.length,
  });

  for (const img of introImages) {
    if (img) addFullImageSlide(pptx, img);
  }

  addCoverSlide(pptx, {
    contractNumber,
    customerName,
    customerEmail,
    description,
    period,
    totalBillboards: billboardsToInclude.length,
    coverTitle,
  });

  for (let i = 0; i < billboardsToInclude.length; i++) {
    const bb = billboardsToInclude[i]!;
    const imageBase64 = imageMap.get(bb.billboardCode);
    if (!imageBase64) continue;
    addBillboardSlide(pptx, bb, imageBase64);
    if (i % 5 === 0) {
      onProgress?.({
        stage: "Generando presentación",
        current: i + 1,
        total: billboardsToInclude.length,
      });
    }
  }

  if (outroImage) addFullImageSlide(pptx, outroImage);

  onProgress?.({ stage: "Empaquetando archivo", current: 0, total: 1 });

  const fileName = sanitizeFileName(
    `${fileNamePrefix} - ${contractNumber} - ${period}.pptx`,
  );
  const blob = (await pptx.write({ outputType: "blob" })) as Blob;

  onProgress?.({ stage: "Completado", current: 1, total: 1 });

  return { blob, fileName, period };
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

interface CoverSlideData {
  contractNumber: string;
  customerName: string;
  customerEmail: string;
  description: string;
  period: string;
  totalBillboards: number;
  coverTitle: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addCoverSlide(pptx: any, data: CoverSlideData) {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND_DARK };

  slide.addText(data.coverTitle, {
    x: 0.6,
    y: 1.6,
    w: SLIDE_W - 1.2,
    h: 0.6,
    fontSize: 18,
    bold: true,
    color: BRAND_ACCENT,
    fontFace: "Arial",
    charSpacing: 6,
  });

  slide.addText(data.period, {
    x: 0.6,
    y: 2.15,
    w: SLIDE_W - 1.2,
    h: 1.1,
    fontSize: 56,
    bold: true,
    color: WHITE,
    fontFace: "Arial",
  });

  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 3.45,
    w: 1.5,
    h: 0,
    line: { color: BRAND_ACCENT, width: 3 },
  });

  slide.addText(`Contrato ${data.contractNumber}`, {
    x: 0.6,
    y: 3.7,
    w: SLIDE_W - 1.2,
    h: 0.5,
    fontSize: 22,
    color: WHITE,
    fontFace: "Arial",
  });

  if (data.description) {
    slide.addText(data.description, {
      x: 0.6,
      y: 4.2,
      w: SLIDE_W - 1.2,
      h: 0.45,
      fontSize: 16,
      color: "B3C7DD",
      fontFace: "Arial",
      italic: true,
    });
  }

  let y = 5.2;
  const addInfoLine = (label: string, value: string) => {
    slide.addText(
      [
        {
          text: `${label}  `,
          options: { color: BRAND_ACCENT, bold: true, fontSize: 12 },
        },
        { text: value, options: { color: WHITE, fontSize: 13 } },
      ],
      {
        x: 0.6,
        y,
        w: SLIDE_W - 1.2,
        h: 0.35,
        fontFace: "Arial",
      },
    );
    y += 0.4;
  };

  addInfoLine("CLIENTE:", data.customerName || "—");
  if (data.customerEmail) addInfoLine("CONTACTO:", data.customerEmail);
  addInfoLine(
    "VALLAS INCLUIDAS:",
    `${data.totalBillboards} ${data.totalBillboards === 1 ? "valla" : "vallas"}`,
  );

  slide.addText("VEO MEDIA", {
    x: 0.6,
    y: SLIDE_H - 0.6,
    w: SLIDE_W - 1.2,
    h: 0.3,
    fontSize: 10,
    color: "8AA4BF",
    fontFace: "Arial",
    charSpacing: 4,
  });
}

 
function addBillboardSlide(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pptx: any,
  bb: ContractReportBillboard,
  imageBase64: string,
) {
  const slide = pptx.addSlide();
  slide.background = { fill: WHITE };

  slide.addText(bb.billboardCode || "—", {
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
  const imgW = 8.5;
  const imgH = 5.9;

  slide.addImage({
    data: imageBase64,
    x: imgX,
    y: imgY,
    w: imgW,
    h: imgH,
    sizing: { type: "contain", w: imgW, h: imgH },
  });

  const panelX = 9.15;
  const panelW = 3.8;
  let y = 1.1;

  const addLabel = (label: string) => {
    slide.addText(label, {
      x: panelX,
      y,
      w: panelW,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: LABEL_COLOR,
      fontFace: "Arial",
      charSpacing: 3,
    });
    y += 0.3;
  };

  const addValue = (value: string, height = 0.5) => {
    slide.addText(value, {
      x: panelX,
      y,
      w: panelW,
      h: height,
      fontSize: 13,
      color: VALUE_COLOR,
      fontFace: "Arial",
      wrap: true,
      valign: "top",
    });
    y += height + 0.15;
  };

  addLabel("CÓDIGO DE VALLA");
  addValue(bb.billboardCode || "—", 0.4);

  addLabel("DIRECCIÓN");
  const address = bb.billboardAddress || "—";
  const addressHeight = address.length > 80 ? 1.3 : address.length > 40 ? 0.95 : 0.6;
  addValue(address, addressHeight);

  const mapsUrl = getMapsUrl(bb.latitude, bb.longitude);
  if (mapsUrl) {
    addLabel("UBICACIÓN EN MAPA");
    slide.addText(
      [
        {
          text: "Abrir en Google Maps  →",
          options: {
            hyperlink: { url: mapsUrl },
            fontSize: 12,
            color: BRAND_ACCENT,
            bold: true,
          },
        },
      ],
      {
        x: panelX,
        y,
        w: panelW,
        h: 0.4,
        fontFace: "Arial",
      },
    );
    y += 0.45;

    slide.addText(mapsUrl, {
      x: panelX,
      y,
      w: panelW,
      h: 0.8,
      fontSize: 8,
      color: "888888",
      fontFace: "Arial",
      wrap: true,
    });
  }
}
