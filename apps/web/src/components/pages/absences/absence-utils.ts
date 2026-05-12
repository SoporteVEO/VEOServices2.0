export function computeAbsenceDays(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0;
  const ms = to.getTime() - from.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const cleaned = result.includes(",") ? result.split(",")[1] : result;
      resolve(cleaned);
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}
