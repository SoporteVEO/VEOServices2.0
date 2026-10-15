export const MAX_PRODUCTION_ART_SIZE = 100 * 1024 * 1024;

const ART_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "application/pdf",
];

const PREVIEWABLE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const PRODUCTION_ART_ACCEPT = ART_MIME_TYPES.join(",");

export const PRODUCTION_ART_FORMATS_LABEL = "JPG, PNG, WEBP, TIFF o PDF";

/** Returns a user-facing error, or null when the file can be uploaded. */
export function validateProductionArt(file: File): string | null {
  if (!ART_MIME_TYPES.includes(file.type)) {
    return `Formato no permitido. Usa ${PRODUCTION_ART_FORMATS_LABEL}.`;
  }
  if (file.size > MAX_PRODUCTION_ART_SIZE) {
    return `El arte supera el tamaño máximo permitido (${MAX_PRODUCTION_ART_SIZE / (1024 * 1024)}MB).`;
  }
  return null;
}

export function isPreviewableArt(mimeType: string): boolean {
  return PREVIEWABLE_MIME_TYPES.has(mimeType);
}

export function artFormatLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "image/tiff") return "TIFF";
  return mimeType.replace("image/", "").toUpperCase();
}

export function formatArtFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
