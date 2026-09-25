export const MAX_PRODUCTION_PDF_SIZE = 15 * 1024 * 1024;

/** Returns a user-facing error, or null when the file can be uploaded. */
export function validateProductionPdf(file: File): string | null {
  if (file.type !== "application/pdf") {
    return "Solo se permiten archivos PDF.";
  }
  if (file.size > MAX_PRODUCTION_PDF_SIZE) {
    return `El archivo supera el tamaño máximo permitido (${MAX_PRODUCTION_PDF_SIZE / (1024 * 1024)}MB).`;
  }
  return null;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer el archivo"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}
