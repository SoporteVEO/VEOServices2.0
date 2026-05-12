import type { AbsenceImage } from "@/api/absences/absences.types";
import type { AbsencePdfImage } from "./absence-pdf-report";

/**
 * Fetches each absence image from its signed S3 URL and converts it to a
 * PNG data URL using a canvas. We need to convert because absence images
 * are stored as WebP, but `@react-pdf/renderer` only supports JPG and PNG.
 *
 * Failures are logged and excluded from the result so a single bad image
 * doesn't break the entire PDF.
 */
export async function loadAbsencePdfImages(
  images: AbsenceImage[],
): Promise<AbsencePdfImage[]> {
  const results = await Promise.all(images.map(toPdfImage));
  return results.filter((r): r is AbsencePdfImage => r !== null);
}

async function toPdfImage(image: AbsenceImage): Promise<AbsencePdfImage | null> {
  try {
    const response = await fetch(image.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    const pngDataUrl = await convertImageDataUrlToPng(dataUrl);
    return {
      id: image.id,
      createdAt: image.createdAt,
      src: pngDataUrl,
    };
  } catch (err) {
    console.warn(
      `Failed to load absence image ${image.id} for PDF`,
      err,
    );
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(blob);
  });
}

function convertImageDataUrlToPng(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas no soportado"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(
          err instanceof Error
            ? err
            : new Error("No se pudo convertir la imagen a PNG"),
        );
      }
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = dataUrl;
  });
}
