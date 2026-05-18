import { blobToBase64, compressImage } from "@/lib/compress-image";

export function computeAbsenceDays(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0;
  const ms = to.getTime() - from.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

/**
 * Compresses an absence image and returns its base64 contents (no data: prefix).
 *
 * Compression keeps request bodies well below Vercel's 4.5MB serverless
 * function payload limit (FUNCTION_PAYLOAD_TOO_LARGE) and matches the
 * server-side image processing target.
 */
export async function fileToBase64(file: File): Promise<string> {
  const { blob } = await compressImage(file);
  return blobToBase64(blob);
}
