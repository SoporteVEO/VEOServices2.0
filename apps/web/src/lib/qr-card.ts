const CARD_WIDTH = 900;
const PADDING = 56;
const QR_SIZE = 640;

export interface QrCardOptions {
  /** URL the QR code resolves to. */
  url: string;
  /** Large heading, typically the static billboard code. */
  title: string;
  /** Smaller line under the heading, e.g. the campaign. */
  subtitle?: string | null;
  /** Wrapped text printed below the QR, e.g. the installation address. */
  footer?: string | null;
  /** File name (without extension) used for the download. */
  fileName: string;
}

/**
 * Renders a printable card containing the QR code plus the labels an
 * installer needs to match the sticker to a billboard, then downloads it as
 * a PNG. Everything happens client-side so no round trip is needed.
 */
export async function downloadQrCard(options: QrCardOptions): Promise<void> {
  const QRCode = (await import("qrcode")).default;

  const qrDataUrl = await QRCode.toDataURL(options.url, {
    width: QR_SIZE,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  const qrImage = await loadImage(qrDataUrl);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo generar el código QR");

  const footerLines = options.footer
    ? wrapText(ctx, options.footer, CARD_WIDTH - PADDING * 2, "28px sans-serif")
    : [];

  const headerHeight = options.subtitle ? 150 : 100;
  const footerHeight = footerLines.length * 38 + (footerLines.length ? 32 : 0);
  const height = PADDING * 2 + headerHeight + QR_SIZE + footerHeight + 60;

  canvas.width = CARD_WIDTH;
  canvas.height = height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";

  let y = PADDING + 60;

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "bold 60px sans-serif";
  ctx.fillText(options.title, CARD_WIDTH / 2, y);

  if (options.subtitle) {
    y += 50;
    ctx.fillStyle = "#525252";
    ctx.font = "30px sans-serif";
    ctx.fillText(truncate(options.subtitle, 46), CARD_WIDTH / 2, y);
  }

  y += 60;
  ctx.drawImage(qrImage, (CARD_WIDTH - QR_SIZE) / 2, y, QR_SIZE, QR_SIZE);
  y += QR_SIZE + 50;

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "26px sans-serif";
  ctx.fillText("Escanea para registrar la instalación", CARD_WIDTH / 2, y);

  if (footerLines.length) {
    ctx.fillStyle = "#525252";
    ctx.font = "28px sans-serif";
    y += 42;
    for (const line of footerLines) {
      ctx.fillText(line, CARD_WIDTH / 2, y);
      y += 38;
    }
  }

  triggerDownload(canvas.toDataURL("image/png"), `${options.fileName}.png`);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo generar el código QR"));
    image.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  ctx.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  return lines.slice(0, 3);
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function triggerDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
