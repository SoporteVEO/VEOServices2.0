/** Characters Windows and macOS reject in file names. */
const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|]/g;

export function safeFileName(name: string): string {
  return name.replace(ILLEGAL_FILENAME_CHARS, "-");
}

/** Returns a `data:application/pdf;base64,...` string, which is what the API expects. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer el PDF"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el PDF"));
    reader.readAsDataURL(blob);
  });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
