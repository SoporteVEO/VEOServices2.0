/**
 * Long edge of the embedded photos. The photo box is ~720 px wide, so 1800 px
 * stays sharp when zoomed while keeping big contracts under the email
 * attachment limit.
 */
const MAX_IMAGE_EDGE = 1800;
const JPEG_QUALITY = 0.85;

/**
 * Downloads a billboard photo and re-encodes it as a JPEG data URL, because
 * `@react-pdf/renderer` only decodes JPG and PNG and the photos are WebP.
 * Returns null when the photo can't be loaded so one bad image doesn't break
 * the whole report.
 */
export async function loadReportImage(
  url: string,
  maxEdge: number = MAX_IMAGE_EDGE,
): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob());

    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas no soportado");

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch (error) {
    console.warn(`No se pudo cargar la imagen del reporte: ${url}`, error);
    return null;
  }
}
