import type { FileUIPart } from "ai";

export const MAX_AGENT_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2000;
const JPEG_QUALITY = 0.85;

const EXTENSION_TYPES: Record<string, string> = {
  csv: "text/csv",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

const SPREADSHEET_EXTENSIONS = new Set(["xlsx", "xls", "ods"]);

export const AGENT_ATTACHMENT_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  ...Object.keys(EXTENSION_TYPES).map((ext) => `.${ext}`),
  ...[...SPREADSHEET_EXTENSIONS].map((ext) => `.${ext}`),
].join(",");

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function spreadsheetToCsv(file: File): Promise<Blob> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheets = workbook.SheetNames.map(
    (name) =>
      `# Hoja: ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name], { blankrows: false })}`,
  );
  return new Blob([sheets.join("\n\n")], { type: "text/csv" });
}

/** Photos from phones are huge; the model reads them fine at 2000 px. */
async function downscaleImage(file: File, type: string): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height),
  );
  if (scale === 1 && file.size <= MAX_FILE_BYTES / 2) {
    bitmap.close();
    return new Blob([file], { type });
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas"))),
      "image/jpeg",
      JPEG_QUALITY,
    ),
  );
}

export function isSupportedAttachment(file: File) {
  const ext = extensionOf(file.name);
  return SPREADSHEET_EXTENSIONS.has(ext) || ext in EXTENSION_TYPES;
}

export async function toAgentFilePart(file: File): Promise<FileUIPart> {
  const ext = extensionOf(file.name);
  let blob: Blob;
  if (SPREADSHEET_EXTENSIONS.has(ext)) {
    blob = await spreadsheetToCsv(file);
  } else {
    const type = EXTENSION_TYPES[ext];
    if (!type) {
      throw new Error(
        `"${file.name}" no es compatible. Adjunta imágenes, PDF, Excel, CSV o texto.`,
      );
    }
    blob =
      type.startsWith("image/") && type !== "image/gif"
        ? await downscaleImage(file, type)
        : new Blob([file], { type });
  }

  if (blob.size > MAX_FILE_BYTES) {
    throw new Error(`"${file.name}" supera el límite de 8 MB.`);
  }
  return {
    type: "file",
    mediaType: blob.type,
    filename: file.name,
    url: await blobToDataUrl(blob),
  };
}
