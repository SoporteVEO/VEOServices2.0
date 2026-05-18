export interface CompressImageOptions {
  /** Maximum width or height in pixels. Image is downscaled to fit within this. */
  maxDimension?: number;
  /** Output quality, 0-1. Only applies to lossy formats (webp/jpeg). */
  quality?: number;
  /** Output mime type. WebP is preferred for size; JPEG is more compatible. */
  mimeType?: "image/webp" | "image/jpeg";
}

export interface CompressImageResult {
  blob: Blob;
  width: number;
  height: number;
}

const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 0.85;
const DEFAULT_MIME_TYPE = "image/webp" as const;

/**
 * Resizes (max dimension) and re-encodes an image entirely in the browser.
 *
 * Phone-camera photos are typically 4-10MB which:
 *  - exceeds Vercel's 4.5MB serverless function payload limit (FUNCTION_PAYLOAD_TOO_LARGE)
 *  - inflates ~33% more when base64-encoded inside JSON
 *
 * Compressing to webp at 1920px keeps payloads well under 1MB even for
 * typical phone photos and matches the server-side processing target.
 */
export async function compressImage(
  input: Blob,
  options: CompressImageOptions = {},
): Promise<CompressImageResult> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const mimeType = options.mimeType ?? DEFAULT_MIME_TYPE;

  const decoded = await decodeImage(input);
  let { width, height } = decoded;

  const ratio = Math.min(1, maxDimension / Math.max(width, height));
  if (ratio < 1) {
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    decoded.cleanup();
    throw new Error("Tu navegador no soporta el procesamiento de imágenes.");
  }

  ctx.drawImage(decoded.source, 0, 0, width, height);
  decoded.cleanup();

  const blob = await canvasToBlob(canvas, mimeType, quality);

  return { blob, width, height };
}

interface DecodedImage {
  width: number;
  height: number;
  source: CanvasImageSource;
  cleanup: () => void;
}

async function decodeImage(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: "from-image",
      });
      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fall through to <img> based decoding for formats createImageBitmap
      // can't handle (e.g. HEIC on Safari).
    }
  }

  const img = await loadImageElement(blob);
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    source: img,
    cleanup: () => {},
  };
}

function loadImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("No se pudo procesar la imagen."));
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Reads a Blob and returns the raw base64 contents (no `data:...;base64,` prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(blob);
  });
}
